import { Logger } from '@tooljump/logger';
import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import { watch } from 'fs';
import { validateContextMatch, Runner, Integration, Integrations, Cache, metadataSchema, Config } from '@tooljump/common';

export interface FsIntegrationsConfig {
  logger: Logger;
  path: string;
  watchFiles?: boolean;
  cache?: Cache;
  config: Config;
}

export class FsIntegrations extends Integrations {
    private resolvedRootPath: string;
    private watchFiles: boolean;
    private runner: Runner | null = null;
    private watcher: ReturnType<typeof watch> | null = null;
    private cache: Cache | null = null;
    private config: Config;

    private integrations: Integration[] = [];
    private dataFiles: Array<{ id: string; data: any }> = [];

    constructor(config: FsIntegrationsConfig) {
        super(config.logger); // HasLogger automatically creates child with component: 'fsintegrations'
        this.resolvedRootPath = path.resolve(config.path);
        this.watchFiles = config.watchFiles ?? false;
        this.cache = config.cache || null;
        this.config = config.config;
    }

    async load(runner: Runner, cache?: Cache): Promise<void> {
        this.runner = runner;
        if (cache) {
            this.cache = cache;
        }
        await this.loadFiles();

        if (this.watchFiles) {
            this.startWatching();
        }
    }

    /**
     * Comprehensive path validation to prevent directory traversal attacks
     * Uses multiple layers of validation including real path resolution
     */
    private async validatePath(filePath: string): Promise<boolean> {
        try {
            // Input validation
            if (!filePath || typeof filePath !== 'string') {
                this.logger.warn({
                    operation: 'validate-path',
                    filePath,
                    issue: 'invalid-input'
                }, 'Invalid file path input');
                return false;
            }

            // Remove null bytes and control characters
            const cleanPath = filePath.replace(/[\x00-\x1F\x7F]/g, '');
            if (cleanPath !== filePath) {
                this.logger.warn({
                    operation: 'validate-path',
                    filePath,
                    issue: 'null-bytes-removed'
                }, 'Null bytes or control characters detected in path');
                return false;
            }

            // Normalize Unicode characters
            const normalizedPath = cleanPath.normalize();

            // Check for path traversal patterns (multiple variations)
            const traversalPatterns = [
                /\.\.\//g,           // ../
                /\.\.\\/g,           // ..\
                /\.\.%2F/gi,         // ..%2F (URL encoded)
                /\.\.%5C/gi,         // ..%5C (URL encoded backslash)
                /\.\.%c0%af/gi,      // Unicode bypass
                /\.\.%c1%9c/gi,      // Unicode bypass
                /\.\.%ef%bc%8f/gi,   // Fullwidth slash
                /\.\.%ef%bc%8c/gi,   // Fullwidth backslash
            ];

            for (const pattern of traversalPatterns) {
                if (pattern.test(normalizedPath)) {
                    this.logger.warn({
                        operation: 'validate-path',
                        filePath,
                        pattern: pattern.source,
                        issue: 'path-traversal-detected'
                    }, `Path traversal pattern detected: ${pattern.source}`);
                    return false;
                }
            }

            // Check for absolute paths
            if (path.isAbsolute(normalizedPath)) {
                this.logger.warn({
                    operation: 'validate-path',
                    filePath,
                    issue: 'absolute-path'
                }, 'Absolute path not allowed');
                return false;
            }

            // Resolve the path relative to root
            const resolvedPath = path.resolve(this.resolvedRootPath, normalizedPath);
            
            // Get the real path (resolves symlinks)
            let realPath: string;
            try {
                realPath = await fs.realpath(resolvedPath);
            } catch (error) {
                // If realpath fails, use the resolved path but log it
                this.logger.debug({
                    operation: 'validate-path',
                    filePath,
                    resolvedPath,
                    issue: 'realpath-failed'
                }, 'Real path resolution failed, using resolved path');
                realPath = resolvedPath;
            }

            // Check if the real path is within the allowed root directory
            const relativePath = path.relative(this.resolvedRootPath, realPath);
            
            // Final validation: ensure path doesn't escape the root
            if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
                this.logger.warn({
                    operation: 'validate-path',
                    filePath,
                    realPath,
                    relativePath,
                    issue: 'path-escape-attempt'
                }, 'Path escape attempt detected');
                return false;
            }

            // Additional check: ensure the path doesn't contain multiple slashes that could cause issues
            if (normalizedPath.includes('//') || normalizedPath.includes('\\\\')) {
                this.logger.warn({
                    operation: 'validate-path',
                    filePath,
                    issue: 'multiple-slashes'
                }, 'Multiple consecutive slashes detected');
                return false;
            }

            // Validate file extension for security
            const allowedExtensions = ['.integration.js', '.data.yml', '.data.json'];
            const hasValidExtension = allowedExtensions.some(ext => 
                normalizedPath.toLowerCase().endsWith(ext.toLowerCase())
            );
            
            if (!hasValidExtension) {
                this.logger.warn({
                    operation: 'validate-path',
                    filePath,
                    issue: 'invalid-extension'
                }, 'Invalid file extension');
                return false;
            }

            this.logger.debug({
                operation: 'validate-path',
                filePath,
                realPath,
                relativePath
            }, 'Path validation successful');

            return true;
        } catch (error) {
            this.logger.error({
                operation: 'validate-path',
                filePath,
                errorType: error instanceof Error ? error.name : 'UnknownError'
            }, `Path validation failed for: ${filePath}`, error instanceof Error ? error : undefined);
            return false;
        }
    }

    /**
     * Safely constructs a file path within the root directory
     */
    private async safePath(fileName: string): Promise<string | null> {
        const isValid = await this.validatePath(fileName);
        if (!isValid) {
            this.logger.warn({
                operation: 'safe-path',
                fileName,
                issue: 'path-traversal-attempt'
            }, `Blocked potential directory traversal attempt: ${fileName}`);
            return null;
        }
        return path.join(this.resolvedRootPath, fileName);
    }

    private async loadFiles(): Promise<void> {
        const files = await fs.readdir(this.resolvedRootPath);

        // Load integration files with proper error handling
        const integrationPromises = files
            .filter(file => file.endsWith('.integration.js'))
            .map(file => this.loadIntegrationFile(file));

        if (!integrationPromises.length) {
            this.logger.error({
                operation: 'load-files'
            }, `No integration files found! Please add at least one integration file to the integrations folder: ${this.resolvedRootPath}`);
            throw new Error(`No integration files found! Please add at least one integration file to the integrations folder: ${this.resolvedRootPath}`);
        }

        const integrationResults = await Promise.all(integrationPromises);
        this.integrations = integrationResults.filter((item): item is Integration => item !== null);

        // Load data files (both .data.yml and .data.json)
        const dataFilePromises = files
            .filter(file => file.endsWith('.data.yml') || file.endsWith('.data.json'))
            .map(file => this.loadDataFile(file));

        const dataFileResults = await Promise.all(dataFilePromises);
        this.dataFiles = dataFileResults.filter((item): item is { id: string; data: any } => item !== null);

        // Clear cache after reloading files
        if (this.cache) {
            await this.cache.clear();
            this.logger.debug({
                operation: 'load-files'
            }, 'Cache cleared after file reload');
        }

        this.logger.info({
            operation: 'load-files',
            integrationsLoaded: this.integrations.length,
            dataFilesLoaded: this.dataFiles.length
        }, `Loaded ${this.integrations.length} integrations and ${this.dataFiles.length} data files`);
    }

    /**
     * Loads and validates a single integration file
     */
    private async loadIntegrationFile(file: string): Promise<Integration | null> {
        try {
            const filePath = await this.safePath(file);
            if (!filePath) {
                this.logger.warn({
                    operation: 'load-integration',
                    file,
                    issue: 'invalid-path'
                }, `Skipping integration file with invalid path: ${file}`);
                return null;
            }

            const content = await fs.readFile(filePath, 'utf-8');
            const metadata = await this.runner!.getMetadata(content, filePath);

            // Validate metadata against Zod schema
            let validatedMetadata;
            try {
                validatedMetadata = metadataSchema.parse(metadata);

                if (validatedMetadata.match.contextType === 'generic') {
                    if (!validatedMetadata.match.context.url) {
                        throw new Error('Generic context type requires a url, otherwise it will match all requests. Please add a url to the match object.');
                    }
                    if (!validatedMetadata.match.context.url.startsWith && !validatedMetadata.match.context.url.equals) {
                        throw new Error('Generic context type requires a url with startsWith or equals, otherwise it will match all requests. Please add a url with startsWith or equals to the match object.');
                    }
                    const contextUrl = validatedMetadata.match.context.url.startsWith || validatedMetadata.match.context.url.equals;
                    try {
                        new URL(contextUrl);
                    } catch (error) {
                        throw new Error('Generic context type requires a valid url!');
                    }
                }
                
                // Check if contextType is allowed
                const contextType = validatedMetadata.match.contextType;
                if (contextType !== '*' && !this.config.allowedAdapters.includes(contextType)) {
                    this.logger.warn({
                        operation: 'load-integration',
                        file,
                        contextType,
                        allowedAdapters: this.config.allowedAdapters,
                        issue: 'context-type-not-allowed'
                    }, `Integration ${file} cannot be loaded because contextType '${contextType}' is not in allowedAdapters`);
                    return null;
                }
            } catch (zodError) {
                this.logger.warn({
                    operation: 'load-integration',
                    file,
                    issue: 'schema-validation-failed',
                    zodError: zodError instanceof Error ? {
                        name: zodError.name,
                        message: zodError.message
                    } : String(zodError)
                }, `Integration ${file} failed schema validation: ${zodError instanceof Error ? zodError.message : String(zodError)}`);
                return null;
            }

            this.logger.debug({
                operation: 'load-integration',
                file,
                contextType: validatedMetadata.match.contextType,
                hasUrls: !!validatedMetadata.match.context.urls
            }, `Successfully loaded integration ${file}`);

            return { id: file.replace('.integration.js', ''), code: content, metadata: validatedMetadata };
        } catch (error) {
            this.logger.error({
                operation: 'load-integration',
                file,
                errorType: error instanceof Error ? error.name : 'UnknownError'
            }, `Failed to load integration ${file}`, error instanceof Error ? error : undefined);
            return null;
        }
    }

    /**
     * Loads and parses a single data file (YAML or JSON)
     */
    private async loadDataFile(file: string): Promise<{ id: string; data: any } | null> {
        try {
            const filePath = await this.safePath(file);
            if (!filePath) {
                this.logger.warn({
                    operation: 'load-data-file',
                    file,
                    issue: 'invalid-path'
                }, `Skipping data file with invalid path: ${file}`);
                return null;
            }

            const content = await fs.readFile(filePath, 'utf-8');
            
            let data: any;
            if (file.endsWith('.data.yml')) {
                data = yaml.load(content);
            } else if (file.endsWith('.data.json')) {
                data = JSON.parse(content);
            }
            
            const id = file.replace('.data.yml', '').replace('.data.json', '');
            return { id, data };
        } catch (error) {
            this.logger.warn({
                operation: 'load-data-file',
                file,
                errorType: error instanceof Error ? error.name : 'UnknownError',
                errorMessage: error instanceof Error ? error.message : String(error)
            }, `Could not parse data file ${file}`);
            return null;
        }
    }

    private startWatching(): void {
        if (this.watcher) {
            this.watcher.close();
        }

        this.watcher = watch(this.resolvedRootPath, { recursive: false }, async (eventType, filename) => {
            if (filename && (filename.endsWith('.integration.js') || filename.endsWith('.data.yml') || filename.endsWith('.data.json'))) {
                this.logger.info({

                    operation: 'file-watch',
                    filename,
                    eventType
                }, `File ${filename} changed, reloading integrations and data files`);

                try {
                    await this.loadFiles();
                    this.logger.info({

                        operation: 'file-watch',
                        filename
                    }, 'Files reloaded successfully after change');
                } catch (error) {
                    this.logger.error({

                        operation: 'file-watch',
                        filename,
                        errorType: error instanceof Error ? error.name : 'UnknownError'
                    }, 'Error reloading files after change', error instanceof Error ? error : undefined);
                }
            }
        });

        this.logger.info({

            operation: 'start-watching',
            path: this.resolvedRootPath
        }, `Started watching for changes in ${this.resolvedRootPath}`);
    }

    stopWatching(): void {
        if (this.watcher) {
            this.watcher.close();
            this.watcher = null;
            this.logger.info({

                operation: 'stop-watching'
            }, 'Stopped watching for file changes');
        }
    }

    async getIntegrations(): Promise<Integration[]> {
        return this.integrations;
    }

    async getIntegrationsByContext(context: any): Promise<Integration[]> {
        if (!context || !context.url) {
            this.logger.debug({
                operation: 'get-integrations-by-context',
                issue: 'missing-context-url'
            }, 'No context URL provided, returning empty integrations');
            return [];
        }

        const filteredIntegrations = this.integrations.filter(integration => {
            // Validate metadata structure
            if (!integration.metadata || !integration.metadata.match) {
                this.logger.error({
                    operation: 'get-integrations-by-context',
                    integrationId: integration.id,
                    issue: 'invalid-metadata-at-runtime'
                }, `Integration ${integration.id} has invalid match metadata at runtime`);
                return false;
            }

            try {
                // Primary: Context type matching
                if (integration.metadata.match.contextType) {
                    const contextTypeMatches = integration.metadata.match.contextType === '*' || 
                                             integration.metadata.match.contextType === context.type;
                    
                    if (!contextTypeMatches) {
                        this.logger.debug({
                            operation: 'get-integrations-by-context',
                            integrationId: integration.id,
                            integrationContextType: integration.metadata.match.contextType,
                            contextType: context.type
                        }, `Context type mismatch for integration ${integration.id}`);
                        return false;
                    }
                }

                // Context validation
                const { isValid } = validateContextMatch(
                    context, 
                    integration.metadata.match.context, 
                    this.logger, 
                    integration.metadata.name
                );

                return isValid;
            } catch (error) {
                this.logger.error({
                    operation: 'get-integrations-by-context',
                    integrationId: integration.id,
                    contextUrl: context.url,
                    errorType: error instanceof Error ? error.name : 'UnknownError'
                }, `Error matching integration ${integration.id} with context`, error instanceof Error ? error : undefined);
                return false;
            }
        });

        // Sort by priority (higher priority first) while maintaining original order for same priority
        const sortedIntegrations = filteredIntegrations.sort((a, b) => {
            const priorityA = a.metadata.priority || 100;
            const priorityB = b.metadata.priority || 100;
            
            // Higher priority comes first
            if (priorityA !== priorityB) {
                return priorityB - priorityA;
            }
            
            // Maintain original order for same priority (stable sort)
            return 0;
        });

        this.logger.debug({
            operation: 'get-integrations-by-context',
            filteredCount: filteredIntegrations.length,
            sortedCount: sortedIntegrations.length,
            priorities: sortedIntegrations.map(i => ({ name: i.metadata.name, priority: i.metadata.priority || 100 }))
        }, `Retrieved ${sortedIntegrations.length} integrations sorted by priority`);

        return sortedIntegrations;
    }

    async getDataFiles(): Promise<Array<{ id: string; data: any }>> {
        return this.dataFiles;
    }

    async getDataFileById(id: string): Promise<{ id: string; data: any } | undefined> {
        return this.dataFiles.find(dataFile => dataFile.id === id);
    }
}