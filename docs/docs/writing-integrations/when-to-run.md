---
id: when-to-run
title: When to Run (and contexts)
keywords: [when to run, integration contexts, context matching, integration triggers, tooljump contexts]
description: Learn when and where ToolJump integrations execute using context matching. Understand how to control integration behavior based on page content and URLs.
---

# When to Run

Integrations only execute when they match specific contexts. The `match` property in your metadata controls when and where your integration runs.

Read the [contexts documentation](../core-concepts.md#1-contexts) to understand what they are and how they work.

## Context Data

:::tip
The full context object is always available as the first parameter of the `run` function
:::

Example:

```javascript
run: async function (context, secrets = {}, dataFiles = []) {
    // Current URL
    logger.info('Current URL:', context.url);
    
    // Page title
    logger.info('Page title:', context.page?.title);
    
    // Repository information (GitHub context)
    if (context.page?.repository) {
        logger.info('Repository:', context.page.repository);
        logger.info('Owner:', context.page.user);
    }
    
    // User information
    if (context.user) {
        logger.info('User ID:', context.user.id);
        logger.info('Username:', context.user.username);
    }
}
```

## Context Matching

In order to ensure your integration only runs under a specific set of conditions, you can use the `match` property, which has two main components:

```javascript
match: {
    contextType: 'github',            // What type of context
    context: { /* specific rules */ } // When to run
}
```

## Context Types

Context types define on which websites the integration runs

- `'github'` - GitHub website
- `'aws'` - AWS console website
- `'generic'` - Any other website

## Context Rules

Context rules use operators to match specific conditions:

For example, for the `github` context, you can use the following expression to only run the integration on all repositories hosted by Microsoft:

```javascript
match: {
    contextType: 'github',
    context: {
        'page.repository': { startsWith: 'microsoft/' },
    }
}
```

### URL Matching

For the generic context, which only provides the url, we can use the url matching, like this:

```javascript
match: {
    contextType: 'generic',
    context: {
        url: { startsWith: 'https://some-website.com/' }
    }
}
```

:::warning
If you have at least one integration using a generic adapter, you need to manually allow the extension to run on that page.


:::

The integration will only run on the some-website.com domain.

**Available URL operators:**
- `startsWith` - URL begins with a specific string
- `endsWith` - URL ends with a specific string
- `pattern` - URL matches a regular expression

**Available data operators:**
- `exists` - Property exists (true/false)
- `equals` - Property equals a specific value
- `in` - Property is in an array of values
- `pattern` - Property matches a regular expression

## Advanced Matching

### Multiple Conditions

```javascript
match: {
    contextType: 'github',
    context: {
        'page.repository': { in: ['my-org/repo1', 'my-org/repo2', 'my-org/repo3'] },
    }
}
```

**What it means:** Run on GitHub pages with repositories owned by specific users or orgs. Useful for only running ToolJump on your GitHub org.

### Matching via code

Sometimes, using matchers as expressions might not be expressive enough. Whenever that's the case, you can use the `shouldRun` method in the integration and return `true` or `false`.

```javascript
// show integration only after 4pm (useful when you need to run an integration depending on the moment of the day)
    // operation that can only be performed by code
    const now = new Date();
    if (now.getHours() >= 16) {
        return true;
    }
}
```

## Best Practices

### 1. Be Specific

❌ **Too broad:**
```javascript
match: {
    contextType: 'generic',
    context: {}
}
```

✅ **Better:**
```javascript
// Run this integration on any repository page
match: {
    contextType: 'github',
    context: {
        'page.repository': { startsWith: 'my-org/' }
    }
}
```

### 2. Use Appropriate Context Types

- Use `'generic'` for general web pages
- Use specific types like `'github'` when available

### 3. Split your code across multiple integrations

When integrating multiple tools, the recommended approach is to split the code across multiple integrations that share the same `match` criteria.

For example, you can create three integrations with identical context type and match conditions:
- One integration for Datadog alerts and logs
- One integration for last deployment information  
- One integration for public service URLs

ToolJump will execute all matching integrations, aggregate their results, and present the combined output to users.

Splitting code across multiple integrations provides several advantages:
- **Fault isolation**: If one integration fails, the remaining integrations continue to function
- **Code maintainability**: Smaller, focused codebases are easier to understand and maintain

:::tip
The order in which the integration results are displayed to the user is decided by the `priority` parameter from the `metadata` section. The higher priority are displayed first, the lower later.
:::

## Complete Example

Here's a well-structured context match:

```javascript
module.exports = {
    metadata: {
        name: 'repo-stats',
        description: 'Show repository statistics',
        match: {
            contextType: 'github',
            context: {
                'page.repository': { exists: true },
                'page.user': { exists: true } // only show when a user is logged in to Github
            }
        }
    },
    run: async function (context, secrets = {}, dataFiles = []) {
        // This will only run on GitHub repository pages
        const repo = context.page.repository;
        const user = context.page.user;
        
        // Your integration logic here
    }
};
```

## Next Steps

Now that you understand context matching, learn about:
- **[Generic Context](./generic-context.md)** - Optimizing performance
- **[Caching](./caching.md)** - Optimizing performance
- **[Secrets](./secrets.md)** - Managing configuration
- **[Result Types](./result-types.mdx)** - What to return
