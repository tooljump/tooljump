import { Logger } from "@tooljump/logger";
import { HasLogger } from "./HasLogger";
import { Integration, metadataSchema } from "./types";

export abstract class Secrets extends HasLogger {
    constructor(logger: Logger) {
        super(logger); // HasLogger handles child logger creation
    }
    
    abstract get(key: string): string;
    abstract load(): Promise<void>;

    async getSecretsForIntegration(integration: Integration): Promise<Record<string, any>> {
        const secretMap: Record<string, any> = {};
        for (const secretKey of metadataSchema.parse(integration.metadata).requiredSecrets) {
            const secretValue = this.get(secretKey);
            if (secretValue === undefined) {
                throw new Error(`Secret "${secretKey}" is undefined.`);
            }
            secretMap[secretKey] = secretValue;
        }
        return secretMap;
    }
} 