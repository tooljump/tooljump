/**
 * Core logging interfaces for structured logging across the ToolJump ecosystem
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Structured logging context that provides metadata about the log entry
 */
export interface LogContext {
  /** Component that generated the log (e.g., 'github-integrations', 'vm-runner') */
  component?: string;
  /** Specific operation being performed (e.g., 'clone', 'execute', 'fetch') */
  operation?: string;
  /** Correlation ID to trace related log entries across components */
  correlationId?: string;
  /** Integration name when logging from within an integration */
  integrationName?: string;
  /** Duration of operation in milliseconds */
  duration?: number;
  /** HTTP status code for API-related operations */
  statusCode?: number;
  /** Error code or type for structured error handling */
  errorCode?: string;
  /** Additional custom context data */
  [key: string]: any;
}

/**
 * Core logger interface that all loggers must implement
 */
export interface Logger {
  // Object-first structured logging
  debug(context: LogContext, message: string): void;
  info(context: LogContext, message: string): void;
  warn(context: LogContext, message: string): void;
  error(context: LogContext, message: string, error?: Error): void;

  // String-first convenience overloads (for integrations and simple usage)
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
  
  /** Create a child logger with default context */
  child(defaultContext: LogContext): Logger;
}

/**
 * Configuration for logger initialization
 */
export interface LoggerConfig {
  /** Minimum log level to output */
  level: LogLevel;
  /** Output destinations for logs */
  outputs: LogOutput[];
  /** Function to generate correlation IDs */
  correlationId?: () => string;
  /** Default context to include in all logs */
  defaultContext?: LogContext;
}

/**
 * Output destination for logs (console, file, external service, etc.)
 */
export interface LogOutput {
  /** Output name for identification */
  name: string;
  /** Write a log entry to this output */
  write(entry: LogEntry): void | Promise<void>;
  /** Initialize the output (create files, connect to services, etc.) */
  initialize?(): void | Promise<void>;
  /** Clean up resources when shutting down */
  cleanup?(): void | Promise<void>;
}

/**
 * Internal log entry structure
 */
export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  context: LogContext;
  message: string;
  error?: Error;
  correlationId?: string;
}

/**
 * Simple logger interface for basic usage (backward compatibility)
 */
export interface SimpleLogger {
  (message: string, ...args: any[]): void;
  debug: (context: LogContext, message: string) => void;
  info: (context: LogContext, message: string) => void;
  warn: (context: LogContext, message: string) => void;
  error: (context: LogContext, message: string, error?: Error) => void;
} 
