import { SiteAdapter, Collector } from './types';
import { logger } from '../utils/logger';

export class GenericAdapter implements SiteAdapter {
    public name = 'generic';

    public getDescription(): string {
        return 'Generic adapter for any site with a matching integration.';
    }

    public async matches(): Promise<boolean> {
        // If this method is called, it means no specific adapter (e.g., GitHub)
        // has matched. The background script has already confirmed that the extension
        // has permission to run on this origin. Therefore, we can safely assume
        // this adapter should handle the page.
        logger.debug('GenericAdapter', 'Assuming match: already running on a permitted page.');
        return true;
    }

    public async inject(container: HTMLElement): Promise<void> {
        // A default injection strategy: insert at the top of the body.
        document.body.insertBefore(container, document.body.firstChild);
        return Promise.resolve();
    }

    public getStyle(): React.CSSProperties {
        // Provide a default sticky style.
        return {
            position: 'sticky',
            top: 0,
            zIndex: 99999,
        };
    }

    public getContextType(): string {
        return 'generic';
    }

    public getCollectors(): Collector[] {
        // The generic adapter doesn't have any collectors of its own.
        return [];
    }
} 