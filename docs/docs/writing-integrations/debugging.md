---
id: debugging
title: Debugging
sidebar_label: Debugging
---

# Debugging Integrations

When your integration isn't working as expected, debugging can help you identify and fix the issue. This guide covers various debugging techniques and common problems you might encounter.

:::tip
1. Enable debug logging when investigating issues (both in the Tooljump server config and in the Debug tab of the Chrome extension’s settings)
1. Try to reproduce the issue locally, so you can iterate on integrations quickly
:::

## Checklist

### Setup

Before debugging, please check the setup is correct:
- [ ] The Tooljump server started successfully and you can see a message like `Tooljump server started and listening on port ...` in the logs
- [ ] The URL of the Tooljump server is accessible (the default route should output `Authorization header required`)
- [ ] If hosting in production with HTTPS, make sure the certificate is properly configured
- [ ] The latest version of the Tooljump Chrome Extension is installed
- [ ] In the Chrome Extension's **Connection** tab:
  - [ ] the **Host** field is set to the url of the Tooljump Server (including http/https). Example: `http://localhost:3000` for local.
  - [ ] the **Secure token** field is populated with a secret string, which is also defined in the Tooljump Server
- [ ] The **Providers** tab in the extension's settings shows the active adapters (e.g., AWS, GitHub)
- [ ] There is at least an integration being loaded in Tooljump Server (check presence of `Loaded _ integrations and _ data files` in server logs). If there are no integrations, Tooljump can't show any insights

### Integrations

If a specific integration does not work as expected, check:
- [ ] The website you are entering is either AWS, GitHub, or a URL you specified in an integration using a Generic context.
- [ ] Check the integration file ends in `.integration.js` and you can find a debug log in the Server like `Successfully loaded integration ___.integration.js`. If you don't, Tooljump is not loading the file correctly due to incorrect folder or lack of access.
- [ ] Check match metadata field to ensure it matches the context/page correctly
- [ ] If the extension's debug mode is enabled, and you see the context panel in the bottom right of the page, but you don't see the context bar, it's likely that the integration does not match, or the context bar rendering fails

## Common Issues and Solutions

### 1. Integration Not Running

**Problem:** Your integration doesn't appear on the expected pages.

**Check these first:**
- Verify the file has the `.integration.js` extension
- Ensure the file is in the correct integrations directory
- Check that your `match` criteria are correct

**Debug steps:**
```javascript
// Add logging to see if your integration is being loaded
module.exports = {
    metadata: {
        name: 'debug-example',
        description: 'Debug integration',
        match: {
            contextType: 'github'
        }
    },
    run: async function (context) {
        logger.info('Integration running with context:', context);
        
        // Check what context data is available
        logger.info('Available context keys:', Object.keys(context));
        
        return [
            {
                type: 'text',
                content: 'Debug: Integration is running!'
            }
        ];
    }
};
```

### 2. Context Matching Issues

**Problem:** Integration runs on wrong pages or doesn't run when expected.

**Debug context matching:**
```javascript
match: {
    contextType: 'github',
    context: {
        // Add logging to see what values are available
        'page.repository': { exists: true }
    }
},
run: async function (context) {
    // Log the full context to see what's available
    logger.info(context, 'Full context:');
    
    // Check specific properties
    if (context.page) {
        logger.info(context.page, 'Page context:');
    }
    
    return [
        {
            type: 'text',
            content: `Debug: Repository: ${context.page?.repository || 'undefined'}`
        }
    ];
}
```

### 3. Runtime Errors

**Problem:** Integration crashes or throws errors.

**Add error handling:**
```javascript
run: async function (context) {
    try {
        // Your integration logic here
        const result = await someAsyncOperation();
        
        return [
            {
                type: 'text',
                content: `Success: ${result}`
            }
        ];
    } catch (error) {
        logger.error(error, 'Integration error:');
        
        // Return error information for debugging
        return [
            {
                type: 'text',
                content: `Error: ${error.message}`
            }
        ];
    }
}
```

## Debugging Tools

### 1. Browser Console

The browser console is your primary debugging tool:

- **Open DevTools:** Press `F12` or right-click and select "Inspect"
- **Check Console tab:** Look for errors, warnings, and your log output
- **Check Network tab:** Monitor API calls and see if requests are failing (e.g., the `/context` call to the Tooljump server)

### 2. Integration Logging

Add strategic logging to understand execution flow:

```javascript
run: async function (context) {
  logger.info('=== Integration Start ===');
  logger.info(`Context type: ${context.type}`);
  logger.info(`URL: ${context.url}`);

  if (context.page) {
    logger.info(context.page, 'Page data:');
  }

  // Your logic here
  const result = await processData(context);
  logger.info(result, 'Processed result:');

  logger.info('=== Integration End ===');
  return result;
}
```

## Testing Strategies

### 1. Test on Different Pages

Test your integration on various pages to ensure it works correctly:

- **GitHub:** Different repository pages, user profiles, issue pages
- **AWS:** Different service consoles, regions, account contexts
- **Generic:** Different domains and URL patterns

## Performance Debugging

### 1. Monitor Execution Time

```javascript
run: async function (context) {
    const startTime = Date.now();
    
    // Your integration logic here
    const result = await someOperation();
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    logger.info(`Integration took ${duration}ms`);
    
    return result;
}
```

### 2. Check Caching

If your integration uses caching, verify it's working:

```javascript
// Check if cache is being used
run: async function (context) {
  const cacheKey = `my-integration-${context.page?.repository}`;

  let data = await cache.get(cacheKey);
  if (data) {
    logger.info('Using cached data');
    return data;
  }

  logger.info('Fetching fresh data');
  data = await fetchData();

  await cache.set(cacheKey, data, 300); // Cache for 5 minutes
  return data;
}
```

## Getting Help

When debugging becomes challenging:

1. **Check the logs:** Look for error messages and stack traces
2. **Simplify:** Remove complex logic to isolate the issue
3. **Compare:** Look at working integrations for reference
4. **Document:** Keep notes on what you've tried and what worked
