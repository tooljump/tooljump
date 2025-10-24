import { Logger } from "@tooljump/logger";

export abstract class HasLogger {
    protected logger: Logger;
    
    constructor(logger: Logger) {
        // Automatically create child logger with the extending class name
        this.logger = logger.child({
            component: this.constructor.name.toLowerCase()
        });
    }
} 