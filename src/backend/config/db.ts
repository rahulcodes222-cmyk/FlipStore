/**
 * MongoDB Connection Utility
 * Reusable database connection with connection caching to prevent
 * excessive connections in Next.js development (hot reload).
 * Connection check is deferred to connectDB() to avoid
 * throwing during Next.js build when .env.local is absent.
 */

import mongoose, { Mongoose, ConnectOptions } from 'mongoose';

function getMongodbUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    const msg =
      'MONGODB_URI is not defined in environment variables. On Vercel, add it under Project Settings → Environment Variables.';
    if (process.env.NODE_ENV === 'production') {
      // In production, throw a clear error so withDatabase can return a proper 503
      throw new Error(msg);
    }
    throw new Error(
      `${msg} Please check .env.example and create .env.local`,
    );
  }
  return uri;
}

interface MongooseCache {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = (global as unknown as { mongoose?: MongooseCache }).mongoose ||
  { conn: null, promise: null };

if (!(global as unknown as { mongoose?: MongooseCache }).mongoose) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).mongoose = cached;
}

function isLocalUri(uri: string): boolean {
  return /mongodb(\+srv)?:\/\/(127\.0\.0\.1|localhost|\[::1\])/i.test(uri);
}

function buildConnectionOptions(uri: string): ConnectOptions {
  const local = isLocalUri(uri);
  return {
    dbName: process.env.MONGODB_DB_NAME || 'flipstore',
    serverSelectionTimeoutMS: local ? 5000 : 30000,
    connectTimeoutMS: local ? 5000 : 30000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    minPoolSize: local ? 0 : 2,
    retryWrites: local ? false : true,
    w: 'majority',
    family: 4,
  };
}

async function resetMongoose(): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  } catch {
    // ignore
  }
  cached.conn = null;
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

async function tryConnect(uri: string, label: string): Promise<Mongoose> {
  const instance = await mongoose.connect(uri, buildConnectionOptions(uri));
  console.log(`[MongoDB] Connected (${label}): ${instance.connection.host}`);
  return instance;
}

async function establishConnection(): Promise<Mongoose> {
  const primaryUri = getMongodbUri();
  const dbName = process.env.MONGODB_DB_NAME || 'flipstore';
  const localUri = `mongodb://127.0.0.1:27017/${dbName}`;
  const allowLocalFallback =
    process.env.NODE_ENV !== 'production' && !isLocalUri(primaryUri);

  try {
    return await tryConnect(primaryUri, 'primary');
  } catch (primaryError) {
    console.error('[MongoDB] Primary connection failed:', primaryError);
    await resetMongoose();
    if (!allowLocalFallback) throw primaryError;
    console.warn(`[MongoDB] Attempting local fallback: ${localUri}`);
    try {
      return await tryConnect(localUri, 'local-fallback');
    } catch (fallbackError) {
      console.error('[MongoDB] Local fallback failed:', fallbackError);
      await resetMongoose();
      const msg = `Primary DB unreachable (${errMsg(primaryError)}). Local fallback failed (${errMsg(fallbackError)}). Start MongoDB locally or fix MONGODB_URI/network access.`;
      throw new Error(msg);
    }
  }
}

/**
 * Connect to MongoDB with connection caching.
 * In non-production, falls back to local MongoDB when the configured URI is unreachable.
 */
export async function connectDB(): Promise<Mongoose> {
  if (mongoose.connection.readyState === 1 && cached.conn) {
    return cached.conn;
  }

  if (mongoose.connection.readyState !== 0 || cached.conn || cached.promise) {
    await resetMongoose();
    cached.promise = null;
  }

  if (!cached.promise) {
    cached.promise = establishConnection()
      .then((conn) => {
        cached.conn = conn;
        return conn;
      })
      .catch((error) => {
        cached.promise = null;
        cached.conn = null;
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    cached.conn = null;
    throw error;
  }
}

let dbRetryCount = 0;
const MAX_DB_RETRIES = 2;

export async function runWithDbReconnect<T>(fn: () => Promise<T>): Promise<T> {
  await connectDB();
  try {
    return await fn();
  } catch (error) {
    const msg = errMsg(error).toLowerCase();
    const isConnError =
      msg.includes('client must be connected') ||
      msg.includes('topology is closed') ||
      msg.includes('connection closed') ||
      msg.includes('server selection timed out') ||
      msg.includes('MONGODB_URI is not defined');

    if (isConnError && dbRetryCount < MAX_DB_RETRIES) {
      dbRetryCount++;
      console.error(`[MongoDB] Connection error (retry ${dbRetryCount}/${MAX_DB_RETRIES}):`, errMsg(error));
      await resetMongoose();
      cached.promise = null;
      await connectDB();
      return await fn();
    }

    // Reset retry counter after exhausting retries or non-connection error
    dbRetryCount = 0;
    throw error;
  }
}

export async function disconnectDB(): Promise<void> {
  await resetMongoose();
  cached.promise = null;
}

export function getDBStatus(): { connected: boolean; readyState: number } {
  const state = mongoose.connection.readyState;
  return { connected: state === 1, readyState: state };
}

export default connectDB;
