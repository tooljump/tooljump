export class DebugManager {
  private static instance: DebugManager;

  static getInstance(): DebugManager {
    if (!DebugManager.instance) {
      DebugManager.instance = new DebugManager();
    }
    return DebugManager.instance;
  }

  async isDebugEnabled(): Promise<boolean> {
    return new Promise((resolve) => {
      chrome.storage.local.get(['debugMode'], (result) => {
        resolve(result.debugMode || false);
      });
    });
  }

  async setDebugEnabled(enabled: boolean): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set({ debugMode: enabled }, resolve);
    });
  }
} 