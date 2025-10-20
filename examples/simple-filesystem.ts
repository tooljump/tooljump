import path from 'path';
import 'dotenv/config';
import { ToolJump } from '@tooljump/core';
import { EnvSecrets } from '@tooljump/secrets-env';
import { FsIntegrations } from '@tooljump/integrations-fs';
import { VMRunner } from '@tooljump/runner-vm';
import { LocalCache } from '@tooljump/cache-local';
import { TokenAuth } from '@tooljump/auth-token';
import { LoggerFactory } from '@tooljump/logger';
import { DEFAULT_CONFIG } from '@tooljump/common';

// Initialize the logger - use development config for examples
const logger = LoggerFactory.initialize(
    LoggerFactory.createDevelopmentLogger()
);

const config = DEFAULT_CONFIG;
// add a new url to the generic adapter
config.adapters.generic.urls = ['https://developer.hashicorp.com'];

const tooljump = new ToolJump({
    logger,
    config,
    secrets: new EnvSecrets({ logger }),
    integrations: new FsIntegrations({
        logger,
        config,
        path: path.join(process.cwd(), './data'),
        watchFiles: true
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