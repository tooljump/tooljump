export interface ErrorEntry {
  id: string;
  timestamp: Date;
  component: string;
  message: string;
  error?: any;
  stack?: string;
  url?: string;
}

class ErrorService {
  private errors: ErrorEntry[] = [];
  private listeners: ((errors: ErrorEntry[]) => void)[] = [];
  private maxErrors = 100; // Keep only the last 100 errors

  constructor() {
    // Listen for page navigation to clear old errors
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.clearErrors();
      });
    }
  }

  addError(component: string, message: string, error?: any): void {
    const errorEntry: ErrorEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      component,
      message,
      error,
      stack: this.extractStack(error),
      url: typeof window !== 'undefined' ? window.location.href : undefined
    };

    this.errors.unshift(errorEntry); // Add to beginning for newest first

    // Keep only the last maxErrors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Notify listeners
    this.notifyListeners();

    // Also log to console for debugging
    console.error(`[ToolJump:${component}] ERROR: ${message}`, error);
  }

  getErrors(): ErrorEntry[] {
    return [...this.errors];
  }

  getLatestError(): ErrorEntry | null {
    return this.errors.length > 0 ? this.errors[0] : null;
  }

  clearErrors(): void {
    this.errors = [];
    this.notifyListeners();
  }

  clearErrorById(id: string): void {
    this.errors = this.errors.filter(error => error.id !== id);
    this.notifyListeners();
  }

  subscribe(listener: (errors: ErrorEntry[]) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.errors]));
  }

  private generateId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private extractStack(error: any): string | undefined {
    if (!error) return undefined;
    
    if (error.stack) {
      return error.stack;
    }
    
    if (error instanceof Error) {
      return error.stack;
    }
    
    if (typeof error === 'string') {
      return error;
    }
    
    // Try to stringify the error object
    try {
      return JSON.stringify(error, null, 2);
    } catch {
      return String(error);
    }
  }
}

export const errorService = new ErrorService();
