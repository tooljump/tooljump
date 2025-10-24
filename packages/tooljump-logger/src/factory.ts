import { Logger, LoggerConfig, LogLevel, LogContext, SimpleLogger } from './types';
import { createConsoleLogger, createJsonLogger, createFileLogger, WinstonLogger } from './winston-logger';

/**
 * Logger factory that provides initialization and singleton access to loggers
 */
export class LoggerFactory {
  private static instance: Logger | null = null;
  private static componentLoggers: Map<string, Logger> = new Map();

  /**
   * Initialize the global logger with configuration
   * This should be called once at application startup
   */
  static initialize(logger?: Logger): Logger {
    if (!logger) {
      // Default to console logger
      logger = createConsoleLogger('info');
    }

    this.instance = logger;
    this.componentLoggers.clear(); // Clear any existing component loggers

    return logger;
  }

  /**
   * Get a logger for a specific component
   * Creates a child logger with the component name as default context
   */
  static getLogger(component: string): Logger {
    if (!this.instance) {
      // Auto-initialize with default config if not initialized
      console.warn('Logger not initialized, using default console logger');
      this.initialize();
    }

    if (!this.componentLoggers.has(component)) {
      const componentLogger = this.instance!.child({ component });
      this.componentLoggers.set(component, componentLogger);
    }

    return this.componentLoggers.get(component)!;
  }

  /**
   * Get the global logger instance
   */
  static getInstance(): Logger {
    if (!this.instance) {
      console.warn('Logger not initialized, using default console logger');
      this.initialize();
    }
    return this.instance!;
  }

  /**
   * Create a simple logger function for VM injection (backward compatibility)
   */
  static createSimpleLogger(integrationName?: string): SimpleLogger {
    const logger = this.getInstance();
    
    // Main function for backward compatibility
    const simpleLog = (message: string, ...args: any[]) => {
      const fullMessage = args.length > 0 ? `${message} ${args.join(' ')}` : message;
      logger.info({ 
        component: 'integration',
        integrationName: integrationName || 'unknown'
      }, fullMessage);
    };

    // Structured logging methods
    simpleLog.debug = (context: LogContext, message: string) => {
      logger.debug({ 
        component: 'integration',
        integrationName: integrationName || 'unknown',
        ...context 
      }, message);
    };

    simpleLog.info = (context: LogContext, message: string) => {
      logger.info({ 
        component: 'integration',
        integrationName: integrationName || 'unknown',
        ...context 
      }, message);
    };

    simpleLog.warn = (context: LogContext, message: string) => {
      logger.warn({ 
        component: 'integration',
        integrationName: integrationName || 'unknown',
        ...context 
      }, message);
    };

    simpleLog.error = (context: LogContext, message: string, error?: Error) => {
      logger.error({ 
        component: 'integration',
        integrationName: integrationName || 'unknown',
        ...context 
      }, message, error);
    };

    return simpleLog;
  }

  /**
   * Create common logger configurations for different environments
   */
  static createDevelopmentLogger(): Logger {
    return createConsoleLogger('debug');
  }

  static createProductionLogger(): Logger {
    return createJsonLogger('info');
  }

  static createFileBasedLogger(filename: string): Logger {
    return createFileLogger(filename, 'info');
  }

  /**
   * Reset the factory (mainly for testing)
   */
  static reset(): void {
    this.instance = null;
    this.componentLoggers.clear();
  }
} 