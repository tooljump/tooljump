import { runInNewContext, createContext } from 'vm';
import { Integration, metadataSchema, Runner, Secrets } from '@tooljump/common';
import { Logger, LoggerFactory } from '@tooljump/logger';
import * as path from 'path';

export interface VMRunnerConfig {
  logger: Logger;
}

// Constants
const BUILT_IN_MODULES = [
  'fs', 'path', 'http', 'https', 'url', 'querystring', 'crypto', 'stream', 
  'util', 'events', 'buffer', 'os', 'child_process', 'cluster', 'dgram', 
  'dns', 'domain', 'net', 'readline', 'repl', 'string_decoder', 'tls', 
  'tty', 'v8', 'vm', 'worker_threads', 'zlib'
];

// Helper function to create a cancellable promise
function createCancellablePromise<T>(
  executor: (resolve: (value: T) => void, reject: (reason?: any) => void) => void,
  timeout: number
): { promise: Promise<T>; cancel: () => void } {
  let timeoutId: NodeJS.Timeout;
  let isCancelled = false;

  const promise = new Promise<T>((resolve, reject) => {
    timeoutId = setTimeout(() => {
      isCancelled = true;
      reject(new Error(`Operation timed out after ${timeout}ms`));
    }, timeout);

    executor(
      (value) => {
        if (!isCancelled) {
          clearTimeout(timeoutId);
          resolve(value);
        }
      },
      (reason) => {
        if (!isCancelled) {
          clearTimeout(timeoutId);
          reject(reason);
        }
      }
    );
  });

  const cancel = () => {
    isCancelled = true;
    clearTimeout(timeoutId);
  };

  return { promise, cancel };
}

// Helper function to check if a module is built-in
function isBuiltInModule(moduleName: string): boolean {
  return moduleName.startsWith('node:') || BUILT_IN_MODULES.includes(moduleName);
}

// Helper function to resolve npm modules
function resolveNpmModule(moduleName: string, hostRequire: NodeRequire): any {
  try {
    return hostRequire(moduleName);
  } catch (error) {
    // If that fails, try to resolve it from the examples directory
    try {
      const examplesPath = path.resolve(process.cwd(), 'examples');
      const modulePath = (hostRequire as any).resolve(moduleName, { paths: [examplesPath] });
      return hostRequire(modulePath);
    } catch (resolveError) {
      throw new Error(`Cannot find module '${moduleName}'`);
    }
  }
}

// Helper function to create a basic VM context
function createBaseVMContext(
  requireFn: any, 
  dirname: string, 
  filename: string, 
  additionalGlobals: Record<string, any> = {},
  logger: Logger,
  integrationName?: string
) {
  const context = createContext({
    module: { exports: {} },
    exports: {},
    console: console,
    globalThis: globalThis,
    require: requireFn,
    __dirname: dirname,
    __filename: filename,
    global: {},  // Create a global object within the VM context
    ...additionalGlobals,
  });

  // Inject the full logger object for consistency across the codebase
  // Create a child logger with integration-specific context
  const integrationLogger = logger.child({ 
    component: 'integration:' + (integrationName || 'unknown'),
  });
  
  context.global.logger = integrationLogger;
  context.logger = integrationLogger;
  
  // Inject cache facade if present in additionalGlobals
  if (additionalGlobals && (additionalGlobals as any).cache) {
    (context as any).global.cache = (additionalGlobals as any).cache;
  }
  
  // Inject fetch function
  context.global.fetch = global.fetch;
  context.fetch = context.global.fetch;

  return context;
}

// Helper function to create a fallback require function (no relative imports)
function createFallbackRequire(): any {
  const hostRequire = require;
  
  return function require(moduleName: string): any {
    // Handle built-in Node.js modules
    if (isBuiltInModule(moduleName)) {
      return hostRequire(moduleName);
    }
    
    // Block relative imports when no file path is provided
    if (moduleName.startsWith('./') || moduleName.startsWith('../')) {
      throw new Error(`Relative imports are not supported without a file path. Found: ${moduleName}`);
    }
    
    // Try to resolve npm modules
    return resolveNpmModule(moduleName, hostRequire);
  };
}

// Custom require function for VM context with relative import support
function createVMRequire(currentFilePath?: string, logger?: Logger, additionalGlobals?: Record<string, any>) {
  const hostRequire = require;
  
  return function require(moduleName: string): any {
    // Handle built-in Node.js modules
    if (isBuiltInModule(moduleName)) {
      return hostRequire(moduleName);
    }
    
    // Handle relative imports (./file or ../file)
    if (moduleName.startsWith('./') || moduleName.startsWith('../')) {
      if (!currentFilePath) {
        throw new Error(`Cannot resolve relative module '${moduleName}' without current file path`);
      }
      
      return loadRelativeModule(moduleName, currentFilePath, hostRequire, logger, additionalGlobals);
    }
    
    // Try to resolve npm modules
    return resolveNpmModule(moduleName, hostRequire);
  };
}

// Helper function to load relative modules
function loadRelativeModule(moduleName: string, currentFilePath: string, hostRequire: NodeRequire, logger?: Logger, additionalGlobals?: Record<string, any>): any {
  const currentDir = path.dirname(currentFilePath);
  const resolvedPath = path.resolve(currentDir, moduleName);
  
  // Add .js extension if not present
  const finalPath = resolvedPath.endsWith('.js') ? resolvedPath : resolvedPath + '.js';
  
  try {
    // Check if the file exists and read it
    const fs = hostRequire('fs');
    if (fs.existsSync(finalPath)) {
      // Create a new VM context for the required module
      const moduleCode = fs.readFileSync(finalPath, 'utf8');
      
      // Use fallback logger if none provided
      const moduleLogger = logger || LoggerFactory.createDevelopmentLogger();
      
      const moduleContext = createBaseVMContext(
        createVMRequire(finalPath, logger, additionalGlobals), // Recursive require with new file path
        path.dirname(finalPath),
        finalPath,
        additionalGlobals || {},
        moduleLogger
      );
      
      // Execute the module code
      runInNewContext(moduleCode, moduleContext);
      return moduleContext.module.exports;
    } else {
      throw new Error(`Cannot find module '${moduleName}' at path '${finalPath}'`);
    }
  } catch (error) {
    throw new Error(`Error loading module '${moduleName}': ${error instanceof Error ? error.message : String(error)}`);
  }
}

export class VMRunner extends Runner {
  constructor(config: VMRunnerConfig) {
    super(config.logger); // HasLogger in the inheritance chain already creates child with component: 'vmrunner'
  }

  async getMetadata(integrationCode: string, filePath?: string) {
    // If we have a file path, use it for proper relative imports
    // Otherwise, fall back to a generic path with limited require
    
    const { requireFunction, dirname, filename } = this.createRequireContext(filePath);
    
    // logger and fetch are automatically injected globally by createBaseVMContext
    const context = createBaseVMContext(
      requireFunction, 
      dirname, 
      filename, 
      {}, 
      this.logger, 
      'metadata-extraction'
    );

    const wrapper = `
        (function () {
          const module = { exports: {} };
          ${integrationCode}
          return {
            metadata: module.exports.metadata,
            shouldRun: module.exports.shouldRun,
            run: module.exports.run
          };
        })()
      `;

    const result = runInNewContext(wrapper, context);
    
    // Validate the extracted functions
    this.validateIntegrationFunctions(result, filePath);
    
    return result.metadata;
  }

  private validateIntegrationFunctions(result: any, filePath?: string) {
    const integrationName = filePath ? path.basename(filePath, '.integration.js') : 'unknown';
    
    // Validate run function (mandatory)
    if (!result.run) {
      const error = new Error(`Integration '${integrationName}' is missing required 'run' function`);
      this.logger.error(
        { 
          operation: 'metadata-validation',
          integrationName,
          error: 'missing-run-function'
        },
        'Integration validation failed: missing run function'
      );
      throw error;
    }
    
    if (typeof result.run !== 'function') {
      const error = new Error(`Integration '${integrationName}' has invalid 'run' property: expected function, got ${typeof result.run}`);
      this.logger.error(
        { 
          operation: 'metadata-validation',
          integrationName,
          error: 'invalid-run-function',
          actualType: typeof result.run
        },
        'Integration validation failed: run is not a function'
      );
      throw error;
    }
    
    // Validate shouldRun function (optional, but must be function if exists)
    if (result.shouldRun !== undefined && typeof result.shouldRun !== 'function') {
      const error = new Error(`Integration '${integrationName}' has invalid 'shouldRun' property: expected function, got ${typeof result.shouldRun}`);
      this.logger.error(
        { 
          operation: 'metadata-validation',
          integrationName,
          error: 'invalid-shouldrun-function',
          actualType: typeof result.shouldRun
        },
        'Integration validation failed: shouldRun is not a function'
      );
      throw error;
    }
    
    this.logger.debug(
      { 
        operation: 'metadata-validation',
        integrationName
      },
      'Integration validation passed'
    );
  }

  // Helper method to create require context based on file path
  private createRequireContext(filePath?: string, additionalGlobals?: Record<string, any>) {
    if (filePath) {
      return {
        requireFunction: createVMRequire(filePath, this.logger, additionalGlobals),
        dirname: path.dirname(filePath),
        filename: filePath,
      };
    } else {
      // Fallback for when no file path is provided
      return {
        requireFunction: createFallbackRequire(),
        dirname: path.join(process.cwd(), 'examples', 'data'),
        filename: path.join(process.cwd(), 'examples', 'data', 'integration.js'),
      };
    }
  }

  async shouldRun(integration: Integration, context: any, options?: { globals?: Record<string, any> }): Promise<boolean> {
    // Determine the integration file path based on the integration metadata name
    // The FsIntegrations class uses path.join(process.cwd(), './data') 
    // So the actual file location is process.cwd() + '/data'
    const integrationFileName = `${integration.metadata.name}.integration.js`;
    const integrationFilePath = path.join(process.cwd(), 'data', integrationFileName);
    
    this.logger.debug(
      { 
        operation: 'should-run-evaluation',
        integrationName: integration.metadata.name,
        contextUrl: context.url
      },
      'Evaluating shouldRun for integration'
    );
    
    // Create a new context for shouldRun evaluation
    const cacheInstance = options?.globals?.cache;
    const additionalGlobals = cacheInstance ? { cache: this.createCacheFacade(cacheInstance, integration.metadata.name) } : {};
    const vmContext = createBaseVMContext(
      createVMRequire(integrationFilePath, this.logger, additionalGlobals),
      path.dirname(integrationFilePath),
      integrationFilePath,
      additionalGlobals,
      this.logger,
      integration.metadata.name
    );

    // Prepare the shouldRun execution code
    const contextString = JSON.stringify(context);
    const code = `
        (async () => {
          const module = { exports: {} };
          ${integration.code}
          return module.exports.shouldRun ? module.exports.shouldRun(${contextString}) : true;
        })()
      `;

    try {
      const result = await this.executeWithTimeout(code, vmContext, 1000); // 1 second timeout for shouldRun
      const shouldRun = Boolean(result);
      
      this.logger.debug(
        { 
          operation: 'should-run-evaluation',
          integrationName: integration.metadata.name,
          shouldRun,
          contextUrl: context.url
        },
        `shouldRun evaluation result: ${shouldRun}`
      );
      
      return shouldRun;
    } catch (error) {
      this.logger.error(
        { 
          operation: 'should-run-evaluation',
          integrationName: integration.metadata.name,
          errorCode: error instanceof Error ? error.name : 'UnknownError'
        },
        'shouldRun evaluation failed',
        error instanceof Error ? error : undefined
      );
      return false; // fail safe - don't run if shouldRun fails
    }
  }

  async run(
    integration: Integration,
    context: any,
    secrets: Secrets,
    dataFiles?: Array<{ id: string; data: any }>,
    timeout = 5000,
    options?: { globals?: Record<string, any> },
  ) {
    // First check if the integration should run
    const shouldRun = await this.shouldRun(integration, context, options);
    if (!shouldRun) {
      this.logger.debug(
        { 
          operation: 'execute-integration',
          integrationName: integration.metadata.name
        },
        'Integration shouldRun returned false, skipping execution'
      );
      return []; // Return empty results
    }

    // Determine the integration file path based on the integration metadata name
    // The FsIntegrations class uses path.join(process.cwd(), this.path) where this.path is '/data'
    // So the actual file location is process.cwd() + '/data'
    const integrationFileName = `${integration.metadata.name}.integration.js`;
    const integrationFilePath = path.join(process.cwd(), 'data', integrationFileName);
    
    // Log the start of integration execution
    this.logger.debug(
      { 
        operation: 'execute-integration',
        integrationName: integration.metadata.name
      },
      'Starting integration execution'
    );
    
    // Create a new context for each run
    // logger and fetch are automatically injected globally by createBaseVMContext
    const cacheInstance = options?.globals?.cache;
    const additionalGlobals = cacheInstance ? { cache: this.createCacheFacade(cacheInstance, integration.metadata.name) } : {};
    const vmContext = createBaseVMContext(
      createVMRequire(integrationFilePath, this.logger, additionalGlobals),
      path.dirname(integrationFilePath),
      integrationFilePath,
      additionalGlobals,
      this.logger,
      integration.metadata.name
    );

    // Prepare the execution code
    const code = await this.createExecutionCode(integration, context, secrets, dataFiles);

    // Execute with timeout
    const startTime = Date.now();
    try {
      const result = await this.executeWithTimeout(code, vmContext, timeout);
      
      // Log successful execution
      this.logger.debug(
        {
          operation: 'execute-integration',
          integrationName: integration.metadata.name,
          duration: Date.now() - startTime
        },
        'Integration execution completed successfully'
      );
      
      return result;
    } catch (error) {
      // Log failed execution
      this.logger.error(
        { 
          operation: 'execute-integration',
          integrationName: integration.metadata.name,
          duration: Date.now() - startTime,
          errorCode: error instanceof Error ? error.name : 'UnknownError'
        },
        'Integration execution failed',
        error instanceof Error ? error : undefined
      );
      throw error;
    }
  }

  // Creates a minimal cache facade scoped to an integration
  private createCacheFacade(cacheInstance: { get: (k: string) => Promise<any>; set: (k: string, v: any, ttl: number) => Promise<void> }, integrationName: string) {
    const ns = (key: string) => `i:${integrationName}:${key}`;
    return {
      get: async (key: string) => {
        return cacheInstance.get(ns(key));
      },
      set: async (key: string, value: any, ttl: number) => {
        return cacheInstance.set(ns(key), value, ttl);
      }
    };
  }

  // Helper method to create the execution code
  private async createExecutionCode(
    integration: Integration,
    context: any,
    secrets: Secrets,
    dataFiles?: Array<{ id: string; data: any }>
  ): Promise<string> {
    const contextString = JSON.stringify(context);
    const secretsString = JSON.stringify(await secrets.getSecretsForIntegration(integration));
    const dataFilesString = JSON.stringify(dataFiles || []);

    return `
        (async () => {
          const module = { exports: {} };
          ${integration.code}
          return await module.exports.run(${contextString}, ${secretsString}, ${dataFilesString});
        })()
      `;
  }

  // Helper method to execute code with timeout
  private executeWithTimeout(code: string, vmContext: any, timeout: number): Promise<any> {
    const { promise: executionPromise, cancel } = createCancellablePromise((resolve, reject) => {
      try {
        const result = runInNewContext(code, vmContext);
        
        // If the result is a promise, handle it properly
        if (result && typeof result.then === 'function') {
          result.then(resolve).catch(reject);
        } else {
          resolve(result);
        }
      } catch (error) {
        reject(error);
      }
    }, timeout);

    // Return the promise with cleanup
    return executionPromise.finally(() => {
      // Cancel any pending operations
      cancel();
    });
  }
} 
