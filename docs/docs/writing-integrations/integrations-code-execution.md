---
id: integrations-code-execution
title: Running code in an integration
sidebar_label: Running code in an integration
---
# Running code in an integration

The `run` method in every integration executes when ToolJump matches your integration to the current context.

In `run`, write the code that connects tools across your organization. The method is async, so you can `await` I/O such as HTTP requests or SDK calls.

Your code is JavaScript executed in a sandboxed VM. See the server architecture for details: [Server Architecture](../server-architecture.md).

Here are a few things to keep in mind when writing integration code:

## Importing modules

Use `require` to import modules that are declared in the ToolJump server's `package.json`.

If you need a tool SDK or npm package (e.g., `@aws-sdk/client-s3`), add it to ToolJump’s `package.json`, then `require` it in your integration.

To make http requests to various endpoints, you can use the `fetch` native function.

If you want to share code between integrations, create JavaScript modules and export functions or values using `module.exports`. Shared modules should not include `.integration.` in the filename; otherwise ToolJump will try to load them as integrations.

## Logging

ToolJump provides a `logger` object to every integration. Log messages are emitted by the ToolJump server and can be forwarded to your monitoring tools.

The logger object supports both structured and non-structured logging.

Example:
```javascript
logger.debug({ totalCost, days }, 'Successfully retrieved costs from AWS'); // message + structured data
logger.warn('Error reading from GitHub'); // plain message
```

You can use the usual methods: debug, info, warn, error.

## Cache

A global `cache` object is available in integration code for operation-level caching. This is the same cache instance used by ToolJump for integration result caching and is namespaced per integration automatically.

- get: `await cache.get(key)`  -  returns the cached value or `undefined`
- set: `await cache.set(key, value, ttlSeconds)`  -  stores a value with an explicit TTL in seconds

Keys are automatically prefixed with your integration name, so you only provide the logical key:

```javascript
// Example inside run() method
const usersKey = `org:${context.orgId}:users`;
let users = await cache.get(usersKey);
if (!users) {
  users = await fetchUsersFromAPI();
  await cache.set(usersKey, users, 300); // cache 5 minutes
}
```

:::note
The `cache` object is available in required modules as well.
:::

## Limits

### Timeout

Every integration will be automatically cancelled if it takes more than 5 seconds to run.

This is done to improve user experience and to prevent one integration to block others to load.

Here are some ideas on how you can mitigate this:
1. Instead of doing everything in a single integration, split between integrations. In this way, every integration provides one or two insights, and it doesn't risk timing out.
1. Use caching for longer running operations, so only the first user that accesses that information waits for it
1. Pre-cache the most expensive operations from a process outside ToolJump so that expensive data is always cached and fresh

## Next Steps

Now that you understand what you can and cannot run inside an integration, learn about:
- **[Caching](./caching.md)** - Optimize performance and reduce latency
- **[Secrets](./secrets.md)** - Manage sensitive configuration safely
- **[Data](./data.md)** - Work with external data and files
- **[Debugging](./debugging.md)** - Troubleshoot integrations effectively
