import { Cache } from '@tooljump/common';
import { LRUCache } from 'lru-cache';
import { Logger } from '@tooljump/logger';

export interface LocalCacheConfig {
  logger: Logger;
  size: number;
}

export class LocalCache extends Cache {
    private cache: LRUCache<string, any>;

    constructor(config: LocalCacheConfig) {
        super(config.logger); // HasLogger automatically creates child with component: 'localcache'
        
        this.cache = new LRUCache({ max: config.size });
        
        this.logger.debug({
            operation: 'initialize',
            size: config.size
        }, `LocalCache initialized with size ${config.size}`);
    }

    async get(key: string): Promise<any> {
        const value = this.cache.get(key);
        this.logger.debug({
            operation: 'get',
            key,
            hit: value !== undefined
        }, `Cache ${value !== undefined ? 'hit' : 'miss'} for key: ${key}`);
        return value;
    }

    async set(key: string, value: any, ttl: number): Promise<void> {
        this.cache.set(key, value, { ttl: ttl * 1000 }); // Convert to milliseconds
        this.logger.debug({
            operation: 'set',
            key,
            ttl
        }, `Cached value for key: ${key} with TTL: ${ttl}s`);
    }

    async clear(): Promise<void> {
        const sizeBefore = this.cache.size;
        this.cache.clear();
        this.logger.info({
            operation: 'clear',
            itemsCleared: sizeBefore
        }, `Cache cleared, removed ${sizeBefore} items`);
    }
}