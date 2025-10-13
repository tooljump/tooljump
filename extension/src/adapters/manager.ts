import { Context, SiteAdapter } from './types';
import { AWSAdapter } from './aws';
import { GitHubAdapter } from './github';
import { GenericAdapter } from './generic';
import { logger } from '../utils/logger';
import { Settings } from '../utils/contextService';

export class CollectorManager {
  private siteContexts: SiteAdapter[];
  private currentSiteContext: SiteAdapter | null = null;
  private currentContext: Context = { url: '' };
  private onContextUpdate?: (context: Context) => void;
  private debounceTimeout: ReturnType<typeof setTimeout> | null = null;
  
  // Store references for cleanup
  private originalPushState: typeof history.pushState;
  private originalReplaceState: typeof history.replaceState;
  private mutationObserver: MutationObserver | null = null;
  private popstateHandler: () => void;
  private hashchangeHandler: () => void;
  
  // Single static instance
  private static instance: CollectorManager | null = null;

  constructor() {
    this.siteContexts = [
      new AWSAdapter(),
      new GitHubAdapter(),
      new GenericAdapter(),
    ];

    // Initialize observer references
    this.originalPushState = history.pushState;
    this.originalReplaceState = history.replaceState;
    this.mutationObserver = null;
    this.popstateHandler = () => {};
    this.hashchangeHandler = () => {};

    // Set up URL change detection
    this.setupUrlChangeDetection();
    
    // Set the static instance
    CollectorManager.instance = this;
  }

  private setupUrlChangeDetection() {
    // Store the original methods
    this.originalPushState = history.pushState;
    this.originalReplaceState = history.replaceState;

    // Override pushState
    history.pushState = (...args) => {
      this.originalPushState.apply(history, args);
      this.debouncedCollectContext();
    };

    // Override replaceState
    history.replaceState = (...args) => {
      this.originalReplaceState.apply(history, args);
      this.debouncedCollectContext();
    };

    // Create event handlers and store references
    this.popstateHandler = () => {
      this.debouncedCollectContext();
    };
    this.hashchangeHandler = () => {
      this.debouncedCollectContext();
    };

    // Listen for popstate events (back/forward navigation)
    window.addEventListener('popstate', this.popstateHandler);

    // Listen for hashchange events
    window.addEventListener('hashchange', this.hashchangeHandler);

    // Add MutationObserver for DOM changes
    this.setupMutationObserver();
  }

  private setupMutationObserver() {
    // Create a mutation observer to watch for DOM changes
    this.mutationObserver = new MutationObserver(() => {
      this.debouncedCollectContext();
    });

    // Start observing the document body for changes
    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false
    });
  }

  private debouncedCollectContext() {
    // Clear existing timeout
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
    
    // Set new timeout for 400ms debounce (avoid direct window reference for jsdom/node)
    this.debounceTimeout = setTimeout(() => {
      this.collectContext().catch(error => {
        logger.error('CollectorManager', 'Error in collectContext', error);
      });
    }, 400);
  }

  start(onContextUpdate?: (context: Context) => void) {
    this.onContextUpdate = onContextUpdate;
    
    // Initial site context detection and setup
    this.detectAndSetupSiteContext().then(() => {
      // Initial context collection
      this.collectContext();
    });
  }

  stop() {
    this.revertUrlChangeDetection();

    // Clear any pending debounce timeout
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = null;
    }
    
    // Clean up all adapters
    this.siteContexts.forEach(adapter => {
      if (adapter.destroy) {
        adapter.destroy();
      }
    });
  }

  /**
   * Reverts setupUrlChangeDetection() by restoring original state and removing all observers
   * This method leaves everything in the same state as before calling setupUrlChangeDetection()
   */
  public revertUrlChangeDetection() {
    // Restore original history methods
    if (this.originalPushState) {
      history.pushState = this.originalPushState;
    }
    if (this.originalReplaceState) {
      history.replaceState = this.originalReplaceState;
    }

    // Remove event listeners
    if (this.popstateHandler) {
      window.removeEventListener('popstate', this.popstateHandler);
    }
    if (this.hashchangeHandler) {
      window.removeEventListener('hashchange', this.hashchangeHandler);
    }

    // Disconnect mutation observer
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }

    // Clear any pending debounce timeout
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = null;
    }

    // Reset references
    this.originalPushState = undefined as any;
    this.originalReplaceState = undefined as any;
    this.popstateHandler = undefined as any;
    this.hashchangeHandler = undefined as any;
  }

  private async detectAndSetupSiteContext() {
    logger.debug('CollectorManager', 'Detecting site context for', window.location.href);
    
    // First check sync adapters (GitHub, AWS)
    const syncAdapters = this.siteContexts.filter(adapter => adapter.getContextType() !== 'generic');
    let newSiteContext: SiteAdapter | null = null;
    
    logger.debug('CollectorManager', 'Checking specific adapters', syncAdapters.map(a => a.getContextType()));
    
    // Check each sync adapter
    for (const adapter of syncAdapters) {
      logger.debug('CollectorManager', `Testing ${adapter.getContextType()} adapter`);
      if (await adapter.matches()) {
        logger.debug('CollectorManager', `${adapter.getContextType()} adapter matched`);
        newSiteContext = adapter;
        break;
      } else {
        logger.debug('CollectorManager', `${adapter.getContextType()} adapter did not match`);
      }
    }
    
    // If no sync adapter matched, check the generic adapter
    if (!newSiteContext) {
      logger.debug('CollectorManager', 'Testing generic adapter');
      const genericAdapter = this.siteContexts.find(adapter => adapter.getContextType() === 'generic');
      if (genericAdapter) {
        if (await genericAdapter.matches()) {
          logger.debug('CollectorManager', 'Generic adapter matched');
          newSiteContext = genericAdapter;
        } else {
          logger.debug('CollectorManager', 'Generic adapter did not match');
        }
      }
    }
    
    // If site context changed, reset and setup new context
    if (newSiteContext !== this.currentSiteContext) {
      this.currentSiteContext = newSiteContext;
      this.currentContext = { url: window.location.href };
      logger.debug('CollectorManager', 'Site context updated to', newSiteContext?.getContextType() || 'null');
    } else {
      logger.debug('CollectorManager', 'Site context unchanged', this.currentSiteContext?.getContextType() || 'null');
    }
  }

  private async collectContext() {
    logger.debug('CollectorManager', 'Starting context collection');
    
    // Check if site context changed
    // await this.detectAndSetupSiteContext();
    
    if (!this.currentSiteContext) {
      logger.debug('CollectorManager', 'No site context available, cannot collect context');
      return;
    }

    logger.debug('CollectorManager', `Collecting context using ${this.currentSiteContext.getContextType()} adapter`);

    // Start with a fresh context - only the URL
    const newContext: Context = { url: window.location.href };
    
    // Set the context type from the adapter
    newContext.type = this.currentSiteContext.getContextType();
    
    logger.debug('CollectorManager', 'Context type set to', newContext.type);
    
    const previousContext = this.currentContext && this.currentContext.url ? this.currentContext : null;
    
    // Run all collectors from the current site context
    const collectors = this.currentSiteContext.getCollectors();
    logger.debug('CollectorManager', `Running ${collectors.length} collectors`, collectors.map(c => c.name));
    
    for (const collector of collectors) {
      if (collector.shouldRun()) {
        logger.debug('CollectorManager', `Running collector: ${collector.name}`);
        try {
          await collector.run(newContext, previousContext);
        } catch (error) {
          logger.error('CollectorManager', `Error in collector ${collector.name}`, error);
        }
      } else {
        logger.debug('CollectorManager', `Skipping collector: ${collector.name} (shouldRun = false)`);
      }
    }

    // Check if context has actually changed
    const newContextStr = JSON.stringify(newContext);
    const currentContextStr = JSON.stringify(this.currentContext);
    
    if (newContextStr !== currentContextStr) {
      logger.debug('CollectorManager', 'Context updated', newContext);
      this.currentContext = { ...newContext }; // Create a deep copy
      
      if (this.onContextUpdate) {
        logger.debug('CollectorManager', 'Notifying context update callback');
        this.onContextUpdate(this.currentContext);
      }
    } else {
      logger.debug('CollectorManager', 'Context unchanged, not notifying');
    }
  }

  getCurrentContext(): Context {
    return { ...this.currentContext };
  }

  getCurrentSiteContext(): SiteAdapter | null {
    return this.currentSiteContext;
  }

  // Method to inject the container using the current site context
  async injectContainer(container: HTMLElement): Promise<void> {
    // Check display mode setting
    const displayMode = await this.getDisplayMode();
    
    if (displayMode === 'floating') {
      // For floating mode, inject directly into body
      document.body.appendChild(container);
    } else {
      if (this.currentSiteContext) {
        await this.currentSiteContext.inject(container);
      } else {
        // Fallback injection for unknown sites
        document.body.appendChild(container);
      }
    }
  }

  // Helper method to get display mode from Chrome storage
  private async getDisplayMode(): Promise<string> {
    try {
      const settings = await new Promise<Settings>((resolve) => {
        chrome.storage.local.get(['displayMode'], (result: Settings) => {
          resolve(result);
        });
      });
      return settings.displayMode || 'integrated';
          } catch (error) {
        logger.error('CollectorManager', 'Error getting display mode', error);
        return 'integrated';
      }
  }

  // Method to get the current site context's style
  getCurrentStyle(): any {
    return this.currentSiteContext?.getStyle() || null;
  }

  // Static method to get the current site context
  static getCurrentSiteContext(): SiteAdapter | null {
    return CollectorManager.instance?.currentSiteContext || null;
  }
} 
