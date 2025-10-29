---
id: secrets
title: Secrets
sidebar_label: Secrets
keywords: [secrets management, api keys, credentials, secure storage, tooljump secrets]
description: Learn how to securely manage API keys, credentials, and secrets in ToolJump integrations using environment variables and secure storage patterns.
---

# Secrets

Secrets allow you to securely store sensitive configuration like API keys, tokens, and credentials that your integrations need to function.

A few examples: GitHub tokens, AWS access keys, passwords, connection strings, etc.

:::tip
For how ToolJump manages secrets, see [Server Architecture: secrets](../server-architecture.md#manages-secrets-required-for-connecting-to-external-tools-from-integrations).
:::

## Storing secrets
Depending on the secrets adapter you use with ToolJump, store your secrets accordingly. For example, with the env secrets adapter, secrets should be provided as environment variables so the ToolJump server can read them and pass them to your integrations.

To store the secrets in the env adapter (which stores them in the environment variables), you need to prefix them with `INTEGRATION_`. So, the secret in this case should be defined as `INTEGRATION_GITHUB_TOKEN=...`.

## Declaring Required Secrets

After storing the secrets accordingly, use the `requiredSecrets` property in your metadata to define the secrets your integration needs:

```javascript
metadata: {
    name: 'github-stats',
    requiredSecrets: [
        'GITHUB_TOKEN',
    ],
    // ... other metadata
}
```

## Accessing Secrets in Your Integration

Secrets are passed as the second parameter to your `run` function:

```javascript
run: async function (context, secrets = {}) {
    const token = secrets.GITHUB_TOKEN;
    
    const response = await fetch('https://api.github.com/user', {
        headers: {
            // use the token as part of the authorization header
            'Authorization': `token ${token}`
        }
    });
    
    // Your integration logic here
}
```

:::note
Only the secrets declared in `requiredSecrets` are injected into your integration. This scopes access appropriately and prevents other integrations from reading unrelated secrets.
:::

:::tip
No need to check if the secret exists in the `run` function, as it is automatically checked when running the integration. If a secret is not defined, but required by an integration, the integration will not run and a warning will be logged.
:::

## Secret Security Best Practices

### 1. Never Log Secrets

❌ **Dangerous:**
```javascript
logger.info('API Key:', secrets.API_KEY);
logger.info('Token:', secrets.GITHUB_TOKEN);
```

✅ **Safe:**
This just shows whether the secret is defined or not:
```javascript
logger.info('API Key configured:', !!secrets.API_KEY);
logger.info('GitHub token present:', !!secrets.GITHUB_TOKEN);
```

### Secret Rotation

For production use, implement secret rotation:

```javascript
run: async function (context, secrets = {}, dataFiles = []) {
    const primaryToken = secrets.GITHUB_TOKEN_PRIMARY;
    const backupToken = secrets.GITHUB_TOKEN_BACKUP;
    
    // Try primary token first, fallback to backup
    let token = primaryToken;
    if (!primaryToken && backupToken) {
        token = backupToken;
        logger.info('Using backup GitHub token');
    }
    
    // Your integration logic here
}
```

## Next Steps

Now that you understand secrets, you have all the core concepts:
- **[Data](./data.md)** - Provide configuration and reference data
- **[Debugging](./debugging.md)** - Troubleshoot and validate behavior

See secrets in action with our [Datadog integration examples](/integrations/github-datadog-logs-alerts).

You're ready to build powerful, secure integrations!
