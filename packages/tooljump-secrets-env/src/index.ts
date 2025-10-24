import { Secrets } from "@tooljump/common";
import { Logger } from "@tooljump/logger";

export interface EnvSecretsConfig {
  logger: Logger;
}

export class EnvSecrets extends Secrets {
    private secrets: Record<string, string> = {};
    private PREFIX = 'INTEGRATION_';

    constructor(config: EnvSecretsConfig) {
        super(config.logger); // HasLogger automatically creates child with component: 'envsecrets'
        
        this.logger.debug({
            operation: 'initialize'
        }, 'EnvSecrets initialized');
    }

    get(key: string): string {
        const value = this.secrets[key];
        this.logger.debug({
            operation: 'get',
            key,
            found: value !== undefined
        }, `Getting secret for key: ${key}`);
        return value;
    }

    async load(): Promise<void> {
        this.logger.info({
            operation: 'load'
        }, 'Loading secrets from environment variables');
        
        this.secrets = Object.fromEntries(
            Object.entries(process.env)
                .filter(([key]) => key.startsWith(this.PREFIX))
                .map(([key, value]) => [key.replace(this.PREFIX, ''), value])
        ) as Record<string, string>;
        
        this.logger.info({
            operation: 'load',
            secretsCount: Object.keys(this.secrets).length
        }, `Loaded ${Object.keys(this.secrets).length} secrets from environment variables`);
    }
}