export interface Context {
  url: string;
  [key: string]: any;
}

export interface Collector {
  name: string;
  shouldRun(): boolean;
  run(context: Context, previousContext: Context | null): Promise<void>;
}

// New interface for site-specific adapters
export interface SiteAdapter {
  getDescription(): string;
  matches(): Promise<boolean>;
  inject(container: HTMLElement): Promise<void>;
  getStyle(): React.CSSProperties; // Returns CSS object for inline styles
  getContextType(): string; // Returns the context type for this adapter
  getCollectors(): Collector[];
  refreshDomains?(): Promise<void>; // Optional method for adapters that need domain refresh
  destroy?(): void; // Optional cleanup method for adapters that need cleanup
} 