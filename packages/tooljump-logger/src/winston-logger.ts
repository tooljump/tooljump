import winston from 'winston';
import { Logger, LogContext, LogLevel, LogEntry } from './types';

function isPlainObject(value: any): value is Record<string, any> {
  if (value === null || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function formatPart(part: any): string {
  if (typeof part === 'string') return part;
  if (typeof part === 'number' || typeof part === 'boolean') return String(part);
  if (part instanceof Error) return part.message;
  try {
    return JSON.stringify(part);
  } catch {
    return String(part);
  }
}

/**
 * Winston-based logger implementation that provides structured logging
 */
export class WinstonLogger implements Logger {
  private winstonLogger: winston.Logger;
  private defaultContext: LogContext;
  private correlationIdGenerator?: () => string;

  constructor(
    winstonLogger: winston.Logger,
    defaultContext: LogContext = {},
    correlationIdGenerator?: () => string
  ) {
    this.winstonLogger = winstonLogger;
    this.defaultContext = defaultContext;
    this.correlationIdGenerator = correlationIdGenerator;
  }

  // Overloads to satisfy the Logger interface
  debug(context: LogContext, message: string): void;
  debug(message: string, ...args: any[]): void;
  debug(...args: any[]): void {
    const { context, message } = this.normalizeArgs('debug', args);
    this.log('debug', context, message);
  }

  info(context: LogContext, message: string): void;
  info(message: string, ...args: any[]): void;
  info(...args: any[]): void {
    const { context, message } = this.normalizeArgs('info', args);
    this.log('info', context, message);
  }

  warn(context: LogContext, message: string): void;
  warn(message: string, ...args: any[]): void;
  warn(...args: any[]): void {
    const { context, message } = this.normalizeArgs('warn', args);
    this.log('warn', context, message);
  }

  error(context: LogContext, message: string, error?: Error): void;
  error(message: string, ...args: any[]): void;
  error(...args: any[]): void {
    const { context, message, error } = this.normalizeArgs('error', args);
    this.log('error', context, message, error);
  }

  child(defaultContext: LogContext): Logger {
    const mergedContext = { ...this.defaultContext, ...defaultContext };
    return new WinstonLogger(this.winstonLogger, mergedContext, this.correlationIdGenerator);
  }

  private log(level: LogLevel, context: LogContext, message: string, error?: Error): void {
    // Merge default context with provided context
    const fullContext = { ...this.defaultContext, ...context };
    
    // Generate correlation ID if not provided and generator is available
    const correlationId = fullContext.correlationId || this.correlationIdGenerator?.();
    
    // Create the log entry
    const logEntry: LogEntry = {
      timestamp: new Date(),
      level,
      context: fullContext,
      message,
      error,
      correlationId
    };

    // Create Winston log data
    const logData: any = {
      level,
      message,
      timestamp: logEntry.timestamp.toISOString(),
      ...fullContext
    };

    // Add correlation ID if available
    if (correlationId) {
      logData.correlationId = correlationId;
    }

    // Add error details if present
    if (error) {
      logData.error = {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
    }

    // Log through Winston
    this.winstonLogger.log(logData);
  }

  private normalizeArgs(level: LogLevel, args: any[]): { context: LogContext; message: string; error?: Error } {
    // No args - return empty
    if (args.length === 0) {
      return { context: { ...this.defaultContext }, message: '' };
    }

    const first = args[0];

    // String/primitive-first usage: logger.info('a', 'b', obj)
    if (typeof first === 'string' || typeof first === 'number' || typeof first === 'boolean') {
      let error: Error | undefined;
      // For error level, extract trailing Error
      if (level === 'error' && args.length > 1) {
        const last = args[args.length - 1];
        if (last instanceof Error) {
          error = last;
          args = args.slice(0, -1);
        }
      }
      const message = args.map((p: any) => formatPart(p)).join(' ');
      return { context: {}, message, error };
    }

    // Object-first usage: logger.info({ ctx }, 'message', maybeError)
    if (isPlainObject(first)) {
      const context: LogContext = first as LogContext;
      const second = args[1];
      const third = args[2];
      const message = typeof second === 'string' ? second : formatPart(second);
      const error = third instanceof Error ? third : undefined;
      return { context, message, error };
    }

    // Fallback: treat everything as message parts
    const message = args.map((p: any) => formatPart(p)).join(' ');
    return { context: {}, message };
  }
}

/**
 * Create a console-formatted logger for development
 */
export function createConsoleLogger(level: LogLevel = 'info'): WinstonLogger {
  const winstonLogger = winston.createLogger({
    level,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.colorize(),
      winston.format.printf((info: any) => {
        const { timestamp, level, message, component, operation, correlationId, error, ...meta } = info;
        let logLine = `${timestamp} [${level}]`;
        
        // Add component and operation if available
        if (component) {
          logLine += ` [${component}`;
          if (operation) {
            logLine += `:${operation}`;
          }
          logLine += `]`;
        }
        
        // Add correlation ID if available
        if (correlationId) {
          logLine += ` [${correlationId.slice(0, 8)}]`;
        }
        
        logLine += ` ${message}`;
        
        // Add metadata if available
        const metaKeys = Object.keys(meta);
        if (metaKeys.length > 0) {
          const metaStr = metaKeys
            .map(key => `${key}=${meta[key]}`)
            .join(' ');
          logLine += ` {${metaStr}}`;
        }
        
        // Add error if available
        if (error) {
          logLine += `\n  Error: ${error.message}`;
          if (error.stack) {
            logLine += `\n  Stack: ${error.stack}`;
          }
        }
        
        return logLine;
      })
    ),
    transports: [
      new winston.transports.Console()
    ]
  });

  return new WinstonLogger(winstonLogger);
}

/**
 * Create a JSON logger for production/external systems
 */
export function createJsonLogger(level: LogLevel = 'info'): WinstonLogger {
  const winstonLogger = winston.createLogger({
    level,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    transports: [
      new winston.transports.Console()
    ]
  });

  return new WinstonLogger(winstonLogger);
}

/**
 * Create a file logger that writes to a specified file
 */
export function createFileLogger(filename: string, level: LogLevel = 'info'): WinstonLogger {
  const winstonLogger = winston.createLogger({
    level,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    transports: [
      new winston.transports.File({ filename })
    ]
  });

  return new WinstonLogger(winstonLogger);
} 
