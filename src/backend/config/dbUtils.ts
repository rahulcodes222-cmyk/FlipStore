/**
 * Database Utilities
 * Reusable database operations for the multi-vendor e-commerce platform.
 * Includes connection management, health checks, and model initialization.
 */

import mongoose from 'mongoose';
import { connectDB, disconnectDB, getDBStatus } from '@/backend/config/db';

/**
 * Initialize all database connections and verify models are registered.
 * Call this at application startup.
 */
export async function initializeDatabase(): Promise<void> {
  await connectDB();
  console.log('[Database] All models initialized successfully.');
}

/**
 * Close all database connections.
 * Useful for testing or graceful shutdown.
 */
export async function closeDatabase(): Promise<void> {
  await disconnectDB();
  console.log('[Database] All connections closed.');
}

/**
 * Check database health status.
 * Returns connection status and model count.
 */
export async function getDatabaseHealth(): Promise<{
  connected: boolean;
  readyState: number;
  modelCount: number;
  models: string[];
}> {
  const status = getDBStatus();
  const modelNames = mongoose.modelNames();
  return {
    connected: status.connected,
    readyState: status.readyState,
    modelCount: modelNames.length,
    models: modelNames,
  };
}

/**
 * Drop all collections in the database.
 * WARNING: Use only in development/testing environments.
 */
export async function dropDatabase(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Cannot drop database in production environment.');
  }
  await mongoose.connection.dropDatabase();
  console.log('[Database] All collections dropped.');
}

/**
 * Get all registered model names.
 */
export function getModelNames(): string[] {
  return mongoose.modelNames();
}
