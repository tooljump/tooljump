import { HasLogger } from "./HasLogger";
import { Secrets } from "./Secrets";
import { Integration, Metadata } from "./types";

export abstract class Runner extends HasLogger {
    abstract run(
        integration: Integration, 
        context: any, 
        secrets: Secrets, 
        dataFiles?: Array<{ id: string; data: any }>,
        timeout?: number,
        options?: { globals?: Record<string, any> }
    ): Promise<any>;
    abstract getMetadata(integrationCode: string, filePath?: string): Promise<Metadata>;
    abstract shouldRun(integration: Integration, context: any): Promise<boolean>;
} 