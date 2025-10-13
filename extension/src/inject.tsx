import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import Integrated from './components/Integrated';
import Floating from './components/Floating';
import ContextOverlay from './components/ContextOverlay';
import { CollectorManager } from './adapters/manager';
import { Context } from './adapters/types';
import { logger } from './utils/logger';
import { Settings } from './utils/contextService';

// Extended settings type for inject-specific settings
type InjectSettings = Settings & {
  debugShowContext?: boolean;
};

// Simple event emitter for context updates
class ContextEventEmitter {
  private listeners: ((context: Context) => void)[] = [];
  
  subscribe(callback: (context: Context) => void) {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
  
  emit(context: Context) {
    this.listeners.forEach(callback => callback(context));
  }
}

// Global state for injected components
let isInjected = false;
let collectorManager: CollectorManager | null = null;
export let contextEmitter = new ContextEventEmitter();
let latestContext: Context = { url: window.location.href };

// Main App component that manages context state
const App: React.FC = () => {
  const [currentContext, setCurrentContext] = useState<Context>(latestContext);
  const [displayMode, setDisplayMode] = useState<string>('integrated');
  const [demoMode, setDemoMode] = useState<boolean>(false);
  logger.debug('App', 'Component rendered with context', { currentContext, displayMode });

  useEffect(() => {
    logger.debug('App', 'useEffect for initialization');
    logger.debug('App', 'Latest context available', latestContext);
    
    // Use the latest context if it's more recent than our state
    if (latestContext.type && !currentContext.type) {
      logger.debug('App', 'Updating to latest context from global state');
      setCurrentContext(latestContext);
    }
    
    // Load display mode from Chrome storage
    const loadDisplayMode = async () => {
      try {
        const settings = await new Promise<InjectSettings>((resolve) => {
          chrome.storage.local.get(['displayMode', 'demoMode'], (result: InjectSettings) => {
            resolve(result);
          });
        });
        const mode = settings.displayMode || 'integrated';
        const demoMode = settings.demoMode !== false ? true : false;
        logger.debug('App', 'Display mode loaded', mode);
        setDisplayMode(mode);
        setDemoMode(demoMode);
      } catch (error) {
        logger.error('App', 'Error loading display mode', error);
        setDisplayMode('integrated');
      }
    };

    loadDisplayMode();

    // Subscribe to context updates
    const unsubscribe = contextEmitter.subscribe((context: Context) => {
      logger.debug('App', 'Context update received via subscription', context);
      setCurrentContext(context);
    });

    return unsubscribe;
  }, [currentContext.type]); // Re-run when context type changes
  
  // Also check for latest context on each render
  if (latestContext.type && latestContext.type !== currentContext.type) {
    logger.debug('App', 'Render-time context sync, updating to', latestContext);
    setCurrentContext(latestContext);
  }

  logger.debug('App', 'About to render component for displayMode', displayMode);

  // Always render, but Integrated will handle invalid context gracefully with our fallback
  if (displayMode === 'floating') {
    logger.debug('App', 'Rendering Floating');
    return <Floating contexts={[currentContext]} demoMode={demoMode} />;
  } else {
    logger.debug('App', 'Rendering Integrated');
    return <Integrated contexts={[currentContext]} demoMode={demoMode} />;
  }
};

// OverlayApp component for context overlay
const OverlayApp: React.FC = () => {
  const [overlayContext, setOverlayContext] = useState<Context>(latestContext);
  const [showDebugOverlay, setShowDebugOverlay] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  useEffect(() => {
    // Load debug setting from Chrome storage
    const loadDebugSetting = async () => {
      try {
        const settings = await new Promise<InjectSettings>((resolve) => {
          chrome.storage.local.get(['debugShowContext'], (result: InjectSettings) => {
            resolve(result);
          });
        });
        logger.debug('OverlayApp', 'Debug setting loaded', settings.debugShowContext);
        setShowDebugOverlay(settings.debugShowContext || false);
        setIsLoading(false);
      } catch (error) {
        logger.error('OverlayApp', 'Error loading debug setting', error);
        setShowDebugOverlay(false);
        setIsLoading(false);
      }
    };

    loadDebugSetting();

    // Listen for changes to the debug setting
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.debugShowContext) {
        logger.debug('OverlayApp', 'Debug setting changed to', changes.debugShowContext.newValue);
        setShowDebugOverlay(changes.debugShowContext.newValue || false);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    // Subscribe to context updates
    const unsubscribe = contextEmitter.subscribe((context: Context) => {
      logger.debug('OverlayApp', 'Context update received', context);
      setOverlayContext(context);
    });
    
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
      unsubscribe();
    };
  }, []);
  
  // Don't render anything while loading the debug setting
  if (isLoading) {
    return null;
  }
  
  // Only render the overlay if debug setting is enabled
  if (!showDebugOverlay) {
    logger.debug('OverlayApp', 'Debug setting disabled, not rendering overlay');
    return null;
  }
  
  // Don't render the overlay if we don't have a valid context type yet
  if (!overlayContext.type) {
    logger.debug('OverlayApp', 'No valid context type yet, waiting...');
    return null;
  }
  
  logger.debug('OverlayApp', 'Debug setting enabled and valid context, rendering overlay');
  return <ContextOverlay context={overlayContext} />;
};

// Function to inject components only when we have valid context
export async function injectComponents() {
  if (isInjected) {
    return; // Already injected
  }

  logger.info('Content', 'Initializing Tooljump extension on', window.location.href);

  // Initialize collector manager
  collectorManager = new CollectorManager();
  
  // Start the collector manager with our event emitter
  collectorManager.start((context: Context) => {
    logger.debug('Content', 'Context update received', context);
    
    // Store the latest context
    latestContext = context;
    
    // Emit context updates to all subscribers
    contextEmitter.emit(context);
    
    // Only inject UI if we have a valid context (adapter matched) and not already injected
    if (context.type && !isInjected) {
      logger.info('Content', 'Valid context detected, injecting UI components', context);
      
      // Inject main bar
      injectMainBar().then(() => {
        // Inject overlay
        injectContextOverlay();
        
        isInjected = true;
        logger.info('Content', 'UI components injected successfully');
      }).catch((error) => logger.error('Content', 'Failed to inject UI components', error));
    } else if (!context.type && isInjected) {
      logger.warn('Content', 'Context became invalid but UI already injected (keeping UI)');
    } else if (!context.type) {
      logger.debug('Content', 'No adapter matched for this site, skipping injection', context);
    } else if (isInjected) {
      logger.debug('Content', 'UI already injected, context updated');
    }
  });
}

// Function to inject the main bar
async function injectMainBar() {
  logger.debug('injectMainBar', 'Creating container element');
  const container = document.createElement('div');
  container.id = 'tooljump-bar-container';
  
  logger.debug('injectMainBar', 'Container created', container);
  logger.debug('injectMainBar', 'Document body', document.body);
  
  // Use the collector manager to handle injection based on current site context
  await collectorManager!.injectContainer(container);
  
  logger.debug('injectMainBar', 'Container injected into DOM');
  logger.debug('injectMainBar', 'Container parent', container.parentElement);
  logger.debug('injectMainBar', 'Container in document', document.contains(container));
  
  const root = ReactDOM.createRoot(container);
  
  try {
    logger.debug('injectMainBar', 'Rendering React app');
    root.render(<App />);
    logger.debug('injectMainBar', 'React app rendered successfully');
  } catch (error) {
    logger.error('injectMainBar', 'React render error', error);
  }
}

// Function to inject ContextOverlay
function injectContextOverlay() {
  logger.debug('injectContextOverlay', 'Creating overlay container');
  const overlayContainer = document.createElement('div');
  overlayContainer.id = 'context-overlay-container';
  overlayContainer.style.zIndex = '9999999';
  overlayContainer.style.position = 'fixed';
  
  logger.debug('injectContextOverlay', 'Appending to body');
  document.body.appendChild(overlayContainer);
  
  logger.debug('injectContextOverlay', 'Overlay container in document', document.contains(overlayContainer));
  
  const overlayRoot = ReactDOM.createRoot(overlayContainer);
  logger.debug('injectContextOverlay', 'Rendering overlay app');
  overlayRoot.render(<OverlayApp />);
  logger.debug('injectContextOverlay', 'Overlay app rendered successfully');
}

// Page unload listener for cleanup
window.addEventListener('beforeunload', () => {
  if (collectorManager) {
    collectorManager.stop();
  }
});
