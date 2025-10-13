import { describe, it, beforeEach, expect } from 'vitest';
import ReactDOM from 'react-dom/client';
import Popup from './Popup';

declare global { var chrome: any; }

function mockChrome() {
  globalThis.chrome = {
    storage: {
      local: {
        get: (keys: any, cb: Function) => cb({
          host: '',
          secureToken: '',
          displayMode: 'integrated',
          debugShowContext: false,
          debugMode: false,
        }),
        set: (_: any, cb: Function) => cb && cb(),
      },
    },
    permissions: {
      contains: (_: any, cb: Function) => cb(false),
      request: (_: any, cb: Function) => cb(true),
      remove: (_: any, cb: Function) => cb(true),
    },
    runtime: {
      lastError: null,
      sendMessage: (_: any, cb: Function) => cb && cb(),
    },
  };
}

describe('Popup', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
    mockChrome();
  });

  it('renders title and tab buttons, and switches to Display tab', async () => {
    const container = document.getElementById('root')!;
    const root = ReactDOM.createRoot(container);
    root.render(<Popup />);
    // Allow React to flush the initial render
    await new Promise((r) => setTimeout(r, 0));
    // Basic smoke test for title
    expect(container.innerHTML).toContain('Tooljump Settings');
    // Click the Display tab
    const buttons = Array.from(container.querySelectorAll('button')) as HTMLButtonElement[];
    const displayBtn = buttons.find((b) => b.textContent?.includes('Display'))!;
    displayBtn.click();

    // After switching, the Display tab content should be present
    // Look for the section title "Integrated Bar"
    await new Promise((r) => setTimeout(r, 0));
    expect(container.innerHTML).toContain('Integrated Bar');
  });
});
