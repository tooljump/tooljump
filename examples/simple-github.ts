import 'dotenv/config';
import { ToolJump } from '@tooljump/core';
import { EnvSecrets } from '@tooljump/secrets-env';
import { GithubIntegrations } from '@tooljump/integrations-github';
import { VMRunner } from '@tooljump/runner-vm';
import { LocalCache } from '@tooljump/cache-local';
import { TokenAuth } from '@tooljump/auth-token';
import { LoggerFactory } from '@tooljump/logger';
import { DEFAULT_CONFIG } from '@tooljump/common';

const logger = LoggerFactory.initialize(
    LoggerFactory.createDevelopmentLogger()
);

const config = DEFAULT_CONFIG;

const tooljump = new ToolJump({
    logger,
    config,
    secrets: new EnvSecrets({ logger }),
    integrations: new GithubIntegrations({
        logger,
        config,
        accessToken: process.env.GITHUB_TOKEN!,
        repoUrl: process.env.GITHUB_REPO_URL!,
        repoPath: process.env.GITHUB_REPO_PATH!,
        enableWatching: true,
        watchInterval: 300,
    }),
    runner: new VMRunner({ logger }),
    cache: new LocalCache({
        logger,
        size: 1000,
    }),
    auth: new TokenAuth({
        logger,
        token: process.env.TOOLJUMP_SECRET_TOKEN!
    }),
});

tooljump.start(); 