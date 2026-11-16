type LogLevel = 'debug' | 'info' | 'warn' | 'error';

function serialize(value: unknown) {
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: process.env.NODE_ENV === 'production' ? undefined : value.stack };
  }
  return value;
}

function write(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    service: 'ecommerce-backend',
    ...(meta ? { meta: Object.fromEntries(Object.entries(meta).map(([k, v]) => [k, serialize(v)])) } : {}),
  };
  const line = JSON.stringify(entry);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => { if (process.env.NODE_ENV !== 'production') write('debug', message, meta); },
  info: (message: string, meta?: Record<string, unknown>) => write('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => write('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => write('error', message, meta),
};
