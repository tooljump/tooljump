import { errorService } from './errorService';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

class ExtensionLogger {
  private level: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    // In production, only show errors and warnings
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.level = this.isDevelopment ? LogLevel.DEBUG : LogLevel.WARN;
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.level;
  }

  private formatMessage(level: string, component: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const prefix = `[ToolJump:${component}]`;
    return `${timestamp} ${prefix} ${level}: ${message}`;
  }

  error(component: string, message: string, error?: any) {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage('ERROR', component, message), error);
    }
    
    // Always add to error service for popup display
    errorService.addError(component, message, error);
  }

  warn(component: string, message: string, data?: any) {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage('WARN', component, message), data);
    }
  }

  info(component: string, message: string, data?: any) {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage('INFO', component, message), data);
    }
  }

  async debug(component: string, message: string, data?: any) {
    const debugEnabled = await this.isDebugEnabled();
    if (debugEnabled) {
      console.log(this.formatMessage('DEBUG', component, message), data);
    }
  }

  private async isDebugEnabled(): Promise<boolean> {
    return new Promise((resolve) => {
      chrome.storage.local.get(['debugMode'], (result) => {
        resolve(result.debugMode || false);
      });
    });
  }
}

export const logger = new ExtensionLogger(); 