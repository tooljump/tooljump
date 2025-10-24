---
id: caching
title: Caching
sidebar_label: Caching
keywords: [integration caching, data caching, performance optimization, tooljump caching, cache strategy]
description: Learn how to implement caching in ToolJump integrations to improve performance, reduce API calls, and optimize data retrieval for better user experience.
---

# Caching

Caching improves performance by storing integration results and avoiding unnecessary re-execution. ToolJump automatically caches your integration results based on the `cache` property in your metadata.

:::note
For where and how result caching is implemented, see [Server Architecture: caching](../server-architecture.md#caches-results-of-integrations-for-performance-reasons).
:::

:::note
This page describes result caching at the integration level. For caching arbitrary calls within your code, see [Running code in an integration](./integrations-code-execution.md#cache).
:::

## How Caching Works

When you set a `cache` value in your metadata, ToolJump will:

1. **Store results** after the first execution
2. **Return cached results** for subsequent requests within the cache period
3. **Re-execute** the integration when the cache expires

## Cache Configuration

```javascript
metadata: {
    name: 'my-integration',
    cache: 300,  // Cache for 5 minutes (300 seconds)
    // ... other metadata
}
```

## Advanced Caching

### Custom Cache Keys

You can specify custom cache keys for more granular control:

```javascript
metadata: {
    name: 'user-profile',
    cache: 3600,
    match: {
        contextType: 'github',
    }
    cacheKey: ['page.repository', 'page.section.name'],  // Build key from context paths
    // ... other metadata
}
```

### Context-Aware Caching

Cache duration can vary based on context:

```javascript
run: async function (context, secrets = {}, dataFiles = []) {
    // Adjust cache based on context
    let cacheDuration = 300; // Default 5 minutes
    
    if (context.page?.repository === 'important-repo') {
        cacheDuration = 60; // Cache for 1 minute on important repos
    }
    
    // Set cache duration dynamically
    this.metadata.cache = cacheDuration;
    
    // Your integration logic here
}
```

## Debugging Caching

If caching isn't working as expected:

1. **Check cache duration:** Is it set to 0?
2. **Verify context:** Same context = same cache
3. **Check timestamps:** Add logging to see execution frequency
4. **Force refresh:** Temporarily disable caching or change the context


## Next Steps

Now that you understand caching, learn about:
- **[Secrets](./secrets.md)** - Manage sensitive configuration
- **[Data](./data.md)** - Provide external configuration and mappings
- **[Debugging](./debugging.md)** - Diagnose and resolve issues
