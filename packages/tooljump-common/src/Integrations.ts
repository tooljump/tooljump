import { HasLogger } from "./HasLogger";
import { Runner } from "./Runner";
import { Cache } from "./Cache";
import { Integration } from "./types";

export abstract class Integrations extends HasLogger {
    abstract load(runner: Runner, cache?: Cache): Promise<void>;
    abstract getIntegrations(): Promise<Integration[]>;
    abstract getIntegrationsByContext(context: any): Promise<Integration[]>;
    abstract getDataFiles(): Promise<Array<{ id: string; data: any }>>;
    abstract getDataFileById(id: string): Promise<{ id: string; data: any } | undefined>;
} 