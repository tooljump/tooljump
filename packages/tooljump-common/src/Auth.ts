import { Logger } from "@tooljump/logger";
import { HasLogger } from "./HasLogger";

export abstract class Auth extends HasLogger {
    constructor(logger: Logger) {
        super(logger); // HasLogger handles child logger creation
    }
    
    abstract middleware(request: any, response: any, next: any): Promise<void>;
} 