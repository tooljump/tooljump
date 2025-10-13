import express, { Request, Response } from 'express';
import cors from 'cors';
import { z } from 'zod';
import { Integrations, Runner, Secrets, Cache, Auth, generateCacheKey, Config, ResultsArraySchema, Result } from '@tooljump/common';
import { Logger } from '@tooljump/logger';

// Configuration interface that only supports direct instances
export interface ToolJumpConfig {
  logger: Logger;
  secrets: Secrets;
  integrations: Integrations;
  runner: Runner;
  cache: Cache;
  auth: Auth;
  config: Config;
}

export class ToolJump {
  private app: express.Express = express();
  private logger: Logger;
  private config: Config;
  private secrets: Secrets;
  private integrations: Integrations;
  private runner: Runner;
  private cache: Cache;
  private auth: Auth;

  constructor(config: ToolJumpConfig) {
    this.logger = config.logger.child({ component: this.constructor.name.toLowerCase() });
    this.secrets = config.secrets;
    this.integrations = config.integrations;
    this.runner = config.runner;
    this.cache = config.cache;
    this.auth = config.auth;
    this.config = config.config;

    this.setupExpressApp();
  }

  private setupExpressApp(): void {
    this.app.disable('x-powered-by');
    this.app.use(express.json({limit: '100kb'}));
    this.app.use(this.createCorsMiddleware());
    this.app.use(this.auth.middleware);
    this.setupRoutes();
  }

  private createCorsMiddleware() {
    return cors(async (req: any, callback) => {
      const integrationHosts = await this.getIntegrationHosts();
      let whitelist: Array<string | RegExp> = [];
      Object.keys(this.config.adapters).forEach(adapter => {
        if (this.config.allowedAdapters.includes(adapter)) {
          this.config.adapters[adapter].urls.forEach(url => {
            whitelist.push(url);
          });
        }
      });
      whitelist.push(...integrationHosts);

      const origin = req.get('Origin');
      const allowedOrigins = [];
      
      if (origin && (whitelist.some(wl => 
        typeof wl === 'string' ? wl === origin : wl.test(origin)
      ) || req.path === '/custom-domains' || req.path === '/config')) {
        allowedOrigins.push(origin);
      }

      callback(null, { origin: allowedOrigins });
    });
  }

  private setupRoutes(): void {
    this.app.get('/custom-domains', this.handleCustomDomains.bind(this));
    this.app.get('/config', this.handleConfig.bind(this));
    this.app.post('/context', this.handleContext.bind(this));
  }

  private async handleCustomDomains(req: Request, res: Response): Promise<void> {
    try {
      const integrationHosts = await this.getIntegrationHosts();
      res.json({
        hosts: integrationHosts,
        count: integrationHosts.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.handleError(res, 'custom-domains-request', error, 'Error fetching custom domains');
    }
  }

  private async handleConfig(req: Request, res: Response): Promise<void> {
    try {
      const integrationHosts = await this.getIntegrationHosts();
      
      // Build adapters array with enabled status
      const adapters = Object.entries(this.config.adapters).map(([name, config]) => ({
        name,
        enabled: this.config.allowedAdapters.includes(name),
        urls: config.urls.map(url => typeof url === 'string' ? url : url.toString()),
        description: this.getAdapterDescription(name)
      }));

      res.json({
        adapters,
        customDomains: integrationHosts,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.handleError(res, 'config-request', error, 'Error fetching configuration');
    }
  }

  private async handleContext(req: Request, res: Response): Promise<void> {
    try {
      const integrations = await this.integrations.getIntegrationsByContext(req.body);
      
      if (integrations.length === 0) {
        res.send(this.createEmptyResponse());
        return;
      }

      const dataFiles = await this.integrations.getDataFiles();
      const { results, failedIntegrations } = await this.processIntegrations(integrations, req.body, dataFiles);

      this.logIntegrationSummary(failedIntegrations, integrations.length);
      
      res.send({
        data: results,
        count: results.length,
        cacheHits: this.calculateCacheHits(integrations, req.body),
        failedCount: failedIntegrations.length,
        timestamp: new Date().toISOString(),
        integrationNames: integrations.map(i => i.metadata.name)
      });
    } catch (error) {
      this.handleError(res, 'context-request', error, 'Unexpected error in context endpoint');
    }
  }

  private createEmptyResponse() {
    return {
      count: 0,
      cacheHits: 0,
      failedCount: 0,
      timestamp: new Date().toISOString(),
      integrationNames: [],
      data: [],
    };
  }

  private async processIntegrations(integrations: any[], context: any, dataFiles: any[]) {
    const results: any[] = [];
    const failedIntegrations: { integration: string; error: string }[] = [];

    for (const integration of integrations) {
      try {
        const result = await this.executeIntegration(integration, context, dataFiles);
        
        // Validate result format
        const validatedResults = this.validateIntegrationResults(result, integration.metadata.name);
        results.push(...validatedResults);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logIntegrationError(integration.metadata.name, error);
        failedIntegrations.push({ integration: integration.metadata.name, error: errorMessage });
        results.push({
          type: 'text',
          status: 'important',
          content: `${integration.metadata.name}: ${errorMessage}`
        });
      }
    }

    return { results, failedIntegrations };
  }

  private validateIntegrationResults(result: any, integrationName: string): any[] {
    // Ensure result is always an array
    const resultsArray = Array.isArray(result) ? result : (result ? [result] : []);
    
    if (resultsArray.length === 0) {
      return [];
    }

    try {
      // Validate the entire array with Zod
      const validatedResults = ResultsArraySchema.parse(resultsArray);
      return validatedResults;
    } catch (error) {
      // Log validation errors with detailed information
      if (error instanceof z.ZodError) {
        this.logger.warn({
          operation: 'result-validation',
          integrationName,
          errorCount: error.errors.length,
          errors: error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message,
            code: e.code
          }))
        }, `Integration '${integrationName}' returned invalid result format: ${error.errors.length} validation errors`);
      } else {
        this.logger.warn({
          operation: 'result-validation',
          integrationName,
          error: error instanceof Error ? error.message : String(error)
        }, `Integration '${integrationName}' returned invalid result format`);
      }

      // Return error message instead of invalid results
      return [{
        type: 'text' as const,
        status: 'important' as const,
        content: `Integration ${integrationName} failed, check logs`
      }];
    }
  }

  private async executeIntegration(integration: any, context: any, dataFiles: any[]) {
    const cacheKey = this.generateIntegrationCacheKey(integration, context);
    
    // Check cache first
    if (cacheKey) {
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        this.logger.debug({
          operation: 'cache-hit',
          integrationName: integration.metadata.name,
          cacheKey
        }, `Cache hit for integration '${integration.metadata.name}'`);
        return cached;
      }
    }

    // Execute integration
    this.logger.debug({
      operation: 'integration-execution',
      integrationName: integration.metadata.name,
      cacheKey
    }, `Executing integration '${integration.metadata.name}'`);

    const result = await this.runner.run(
      integration,
      context,
      this.secrets,
      dataFiles,
      undefined,
      { globals: { cache: this.cache } }
    );

    // Cache result
    if (cacheKey && result) {
      await this.cache.set(cacheKey, result, integration.metadata.cache);
      this.logger.debug({
        operation: 'cache-set',
        integrationName: integration.metadata.name,
        cacheKey,
        cacheDuration: integration.metadata.cache
      }, `Cached result for integration '${integration.metadata.name}'`);
    }

    return result;
  }

  private generateIntegrationCacheKey(integration: any, context: any): string | null {
    if (integration.metadata.cacheKey?.length > 0) {
      return generateCacheKey(context, integration.metadata.cacheKey, this.logger, integration.metadata.name);
    }
    
    if (integration.metadata.match?.context) {
      const contextPaths = Object.keys(integration.metadata.match.context);
      if (contextPaths.length > 0) {
        return generateCacheKey(context, contextPaths, this.logger, integration.metadata.name);
      }
    }
    
    return null;
  }

  private calculateCacheHits(integrations: any[], context: any): number {
    return integrations.filter(integration => {
      const cacheKey = this.generateIntegrationCacheKey(integration, context);
      return cacheKey !== null;
    }).length;
  }

  private logIntegrationError(integrationName: string, error: any): void {
    this.logger.error({
      operation: 'integration-execution',
      integrationName,
      errorCode: error instanceof Error ? error.name : 'UnknownError'
    }, `Integration execution failed: ${error instanceof Error ? error.message : String(error)}`,
    error instanceof Error ? error : undefined);
  }

  private logIntegrationSummary(failedIntegrations: any[], totalCount: number): void {
    if (failedIntegrations.length > 0) {
      this.logger.warn({
        operation: 'context-request',
        failedCount: failedIntegrations.length,
        totalCount,
        failedIntegrations: failedIntegrations.map(f => f.integration)
      }, `Integration execution summary: ${failedIntegrations.length} out of ${totalCount} integrations failed`);
    }
  }

  private handleError(res: Response, operation: string, error: any, message: string): void {
    this.logger.error({
      operation,
      errorCode: error instanceof Error ? error.name : 'UnknownError'
    }, message, error instanceof Error ? error : undefined);
    
    res.status(500).json({ 
      hosts: [],
      count: 0,
      timestamp: new Date().toISOString(),
      error: 'Internal server error'
    });
  }

  public async start(port = 3000): Promise<void> {
    this.logger.info({ operation: 'startup' }, 'Initializing ToolJump server');
    
    await this.secrets.load();
    this.logger.debug({ operation: 'startup' }, 'Secrets loaded successfully');
    
    await this.integrations.load(this.runner, this.cache);
    this.logger.debug({ operation: 'startup' }, 'Integrations loaded successfully');

    this.app.listen(port, () => {
      this.logger.info({
        operation: 'startup',
        port,
      }, `ToolJump server started and listening on port ${port}`);
    });
  }

  private async getIntegrationHosts(): Promise<string[]> {
    try {
      const integrations = await this.integrations.getIntegrations();
      const hosts: string[] = [];
      
      for (const integration of integrations) {
        const urlMatch = integration.metadata?.match?.context?.url;
        if (integration.metadata?.match?.contextType === 'generic' && urlMatch) {
          const url = this.extractUrlFromMatch(urlMatch);
          if (url) {
            try {
              const host = new URL(url).host;
              hosts.push('https://' + host);
            } catch {
              this.logger.warn({
                operation: 'integration-hosts-extraction',
                integrationName: integration.metadata.name,
                url
              }, `Failed to parse URL from integration '${integration.metadata.name}'`);
            }
          }
        }
      }
      
      this.logger.info({
        operation: 'integration-hosts-extraction',
        extractedHosts: hosts
      }, `Extracted ${hosts.length} integration hosts`);
      
      return hosts;
    } catch (error) {
      this.logger.error({
        operation: 'integration-hosts-extraction',
        errorCode: error instanceof Error ? error.name : 'UnknownError'
      }, 'Failed to extract integration hosts', error instanceof Error ? error : undefined);
      return [];
    }
  }

  private extractUrlFromMatch(urlMatch: any): string | null {
    if ('equals' in urlMatch && urlMatch.equals) return urlMatch.equals;
    if ('startsWith' in urlMatch && urlMatch.startsWith) return urlMatch.startsWith as string;
    if ('endsWith' in urlMatch && urlMatch.endsWith) return urlMatch.endsWith as string;
    if ('in' in urlMatch && Array.isArray(urlMatch.in) && urlMatch.in.length > 0) return urlMatch.in[0];
    return null;
  }

  private getAdapterDescription(name: string): string {
    const descriptions: Record<string, string> = {
      'github': 'GitHub adapter, collecting information about repositories, code, users, issues, pull requests, actions, and more',
      'aws': 'AWS adapter, collecting information about Lambda, DynamoDB, S3, and more',
      'generic': 'Generic adapter for custom domains'
    };
    return descriptions[name] || `Adapter for ${name}`;
  }
};
