import { Logger } from "@tooljump/logger";
import { HasLogger } from "./HasLogger";

export abstract class Cache extends HasLogger {
    constructor(logger: Logger) {
        super(logger); // HasLogger handles child logger creation
    }
    
    abstract get(key: string): Promise<any>;
    abstract set(key: string, value: any, ttl: number): Promise<void>;
    abstract clear(): Promise<void>;
} 