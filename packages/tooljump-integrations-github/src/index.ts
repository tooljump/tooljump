import fs from 'fs/promises';
import path from 'path';
import { accessSync, mkdtempSync } from 'fs';
import os from 'os';
import { Runner, Integration, Integrations, Cache, Config } from '@tooljump/common';
import { FsIntegrations } from '@tooljump/integrations-fs';
import { Logger } from '@tooljump/logger';

// Import isomorphic-git using require to avoid TypeScript issues
const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');

export interface GithubIntegrationsConfig {
  logger: Logger;
  accessToken: string;
  repoUrl: string;
  repoPath?: string;
  enableWatching?: boolean;
  watchInterval?: number;
  tempDir?: string;
  config: Config;
}

/**
 * GithubIntegrations class provides integration loading from GitHub repositories.
 * 
 * Features:
 * - Clones GitHub repositories with authentication
 * - Loads integrations from specific paths within repositories
 * - Automatic git watching with configurable intervals
 * - Proper error handling and cleanup
 * 
 * Example usage:
 * ```typescript
 * const github = new GithubIntegrations({
 *   logger: logger,                   // logger instance (mandatory)
 *   accessToken: 'ghp_your_token_here',
 *   repoUrl: 'https://github.com/username/repo',
 *   repoPath: 'integrations/examples',  // optional path within repo
 *   enableWatching: true,             // enable watching
 *   watchInterval: 300                // pull every 5 minutes
 * });
 * 
 * await github.load(runner, cache);
 * // Repository is cloned and integrations loaded
 * // Git watching starts - first pull happens after 5 minutes
 * // Subsequent pulls happen every 5 minutes thereafter
 * ```
 */

export class GithubIntegrations extends Integrations {
    private fsIntegrations: FsIntegrations;
    private tempDir: string;
    private baseTempDir: string;
    private accessToken: string;
    private repoUrl: string;
    private repoPath: string;
    private enableWatching: boolean;
    private watchInterval: number; // in seconds
    private watchTimer: NodeJS.Timeout | null = null;
    private runner: Runner | null = null;
    private cache: Cache | null = null;
    private author: { name: string; email: string };

    constructor(config: GithubIntegrationsConfig) {
        super(config.logger); // HasLogger automatically creates child with component: 'githubintegrations'

        if (!config.accessToken) {
            throw new Error('GitHub access token is required');
        }
        if (!config.repoUrl) {
            throw new Error('Repository URL is required');
        }
        if (config.watchInterval && config.watchInterval <= 0) {
            throw new Error('Watch interval must be greater than 0 seconds');
        }

        this.accessToken = config.accessToken;
        this.repoUrl = config.repoUrl;
        this.repoPath = config.repoPath ?? '';
        this.enableWatching = config.enableWatching ?? true;
        this.watchInterval = config.watchInterval ?? 300; // 5 minutes default
        this.author = {
                    name: 'ToolJump Auto-Updater',
        email: 'tooljump@auto-updater.local'
        };

        if (config.tempDir) {
            // Check if tempDir is writable using sync method
            try {
                accessSync(config.tempDir, fs.constants.W_OK);
                this.baseTempDir = config.tempDir;
            } catch (error) {
                throw new Error(`Directory ${config.tempDir} is not writable`);
            }
        } else {
            // Create a new temp directory using sync method
            this.baseTempDir = mkdtempSync(path.join(os.tmpdir(), 'tooljump-github-'));
        }

        // The temp directory structure:
        // baseTempDir/repo <- where we clone the repository
        // baseTempDir/repo/repoPath <- where FsIntegrations looks for files
        this.tempDir = path.join(this.baseTempDir, 'repo', this.repoPath);

        this.fsIntegrations = new FsIntegrations({
            logger: this.logger,
            path: this.tempDir,
            watchFiles: false, // Disable fs watching since we handle git watchingor config.cache if available in GithubIntegrationsConfig
            config: config.config
        });
    }

    async load(runner: Runner, cache?: Cache): Promise<void> {
        this.runner = runner;
        this.cache = cache || null;

        try {
            // Initial clone of the repository
            await this.cloneRepository();

            // Load integrations from the cloned repository
            await this.fsIntegrations.load(runner, cache);

            // Start watching if enabled
            if (this.enableWatching) {
                await this.startWatching();
            }

        } catch (error) {
            this.logger.error(
                {

                    operation: 'load',
                    errorCode: error instanceof Error ? error.name : 'UnknownError'
                },
                'Error during GitHub integrations load',
                error instanceof Error ? error : undefined
            );
            throw error;
        }
    }

    private async cloneRepository(): Promise<void> {
        const repoDir = path.join(this.baseTempDir, 'repo');

        this.logger.info(
            {

                operation: 'clone',
                repoUrl: this.repoUrl,
                destinationDir: repoDir
            },
            'Cloning repository'
        );

        await git.clone({
            fs,
            http,
            dir: repoDir,
            url: this.repoUrl,
            onAuth: () => ({
                username: this.accessToken,
                password: 'x-oauth-basic'
            }),
            singleBranch: true,
            depth: 1
        });

        this.logger.info(
            {

                operation: 'clone',
                repoUrl: this.repoUrl,
                destinationDir: repoDir,
                repoPath: this.repoPath || 'root',
                fullPath: this.tempDir
            },
            'Successfully cloned repository'
        );

    }

    private async pullRepository(): Promise<void> {
        const repoDir = path.join(this.baseTempDir, 'repo');


        this.logger.info(
            {

                operation: 'pull',
                repoUrl: this.repoUrl,
                repoDir: repoDir
            },
            'Pulling latest changes from repository'
        );


        await git.pull({
            fs,
            http,
            dir: repoDir,
            onAuth: () => ({
                username: this.accessToken,
                password: 'x-oauth-basic'
            }),
            singleBranch: true,
            author: this.author
        });


        this.logger.info(
            {

                operation: 'pull',
                repoUrl: this.repoUrl
            },
            'Successfully pulled latest changes'
        );
    }

    async startWatching(): Promise<void> {
        if (this.watchTimer) {

            this.logger.info(
                { operation: 'start-watching' },
                'Already watching, stopping previous watcher'
            );
            this.stopWatching();
        }


        this.logger.info(
            {

                operation: 'start-watching',
                watchInterval: this.watchInterval
            },
            'Starting git watching'
        );
        // Set up the interval for pulls (first one happens after the interval)
        this.watchTimer = setInterval(async () => {
            try {
                await this.pullRepository();
                await this.reloadIntegrations();

                this.logger.debug(
                    { operation: 'scheduled-pull' },
                    'Scheduled git pull and reload completed'
                );
            } catch (error) {
                // For scheduled pulls, just log and continue watching
                this.logger.error(
                    {

                        operation: 'scheduled-pull',
                        errorCode: error instanceof Error ? error.name : 'UnknownError'
                    },
                    'Scheduled git pull failed, continuing to watch',
                    error instanceof Error ? error : undefined
                );
            }
        }, this.watchInterval * 1000);

        this.logger.info(
            {

                operation: 'start-watching',
                watchInterval: this.watchInterval
            },
            `Git watching started - first update will happen in ${this.watchInterval} seconds`
        );
    }

    stopWatching(): void {
        if (this.watchTimer) {
            clearInterval(this.watchTimer);
            this.watchTimer = null;

            this.logger.info(
                { operation: 'stop-watching' },
                'Stopped git watching'
            );
        } else {
            this.logger.debug(
                { operation: 'stop-watching' },
                'No active git watcher to stop'
            );
        }
    }

    private async reloadIntegrations(): Promise<void> {
        if (!this.runner) {
            throw new Error('Runner not available - load() must be called first');
        }

        this.logger.debug(
            { operation: 'reload-integrations' },
            'Reloading integrations after git pull'
        );

        await this.fsIntegrations.load(this.runner, this.cache || undefined);

        this.logger.debug(
            { operation: 'reload-integrations' },
            'Integrations reloaded successfully'
        );
    }

    async getIntegrations(): Promise<Integration[]> {
        return this.fsIntegrations.getIntegrations();
    }

    async getIntegrationsByContext(context: any): Promise<Integration[]> {
        return this.fsIntegrations.getIntegrationsByContext(context);
    }

    async getDataFiles(): Promise<Array<{ id: string; data: any }>> {
        return this.fsIntegrations.getDataFiles();
    }

    async getDataFileById(id: string): Promise<{ id: string; data: any } | undefined> {
        return this.fsIntegrations.getDataFileById(id);
    }

    // Cleanup method for graceful shutdown
    async cleanup(): Promise<void> {
        this.stopWatching();
        // Could add temp directory cleanup here if needed

        this.logger.info(
            { operation: 'cleanup' },
            'GitHub integrations cleanup completed'
        );
    }
}