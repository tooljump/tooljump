---
id: connecting-to-datadog
title: Connecting to Datadog
keywords: [connecting to datadog, datadog integration, monitoring integration, observability, tooljump datadog]
description: Connect Datadog monitoring, logs, and alerts with ToolJump to provide contextual observability data directly in your development workflow.
---

import Icon from '@site/src/components/Icon';

# Connecting to Datadog

<Icon name="datadog" size={32} /> Datadog is a cloud-based monitoring and analytics platform that provides real-time visibility into your infrastructure, applications, and logs. It enables proactive alerting, troubleshooting, and performance optimization across your stack.

## Correlating other tools with Datadog

Suggested reading: Best practices for uniformly tagging and correlating resources across your organization.

In order to best leverage Datadog, your infrastructure and other tools must be properly tagged so that they can be easily found in Datadog.

For example, logs for the "webshop" service should be tagged with `service:webshop` so you can easily identify them. If you want to identify logs or alerts based on the repository where their source code is hosted, you can also send a `repository:user/repo` tag.

Learn more in our [connecting tools guide](/docs/connecting-your-tools-resources).

## Interacting with Datadog

To interact with Datadog's API, you'll need two key credentials:

- <Icon name="link" size={16} /> **API Key**: Provides read/write access to metrics, logs, and other data
- <Icon name="link" size={16} /> **Application Key**: Grants read access to dashboards, alerts, and configuration

Both keys are created from a **Datadog Service Role** that you must configure first. Ensure this service role has **read‑only permissions** to maintain least privilege and prevent accidental modifications.

### Steps:
1. As a Datadog admin, create a service role with read‑only permissions
1. Create an app key
1. Create an API key

When setting up the service role, carefully scope permissions to only what your integration needs. This follows the principle of least privilege and reduces security risk.

For more information, please review:
* https://docs.datadoghq.com/account_management/api-app-keys/
* https://docs.datadoghq.com/account_management/org_settings/service_accounts/
* https://docs.datadoghq.com/account_management/rbac/?tab=datadogapplication

:::warning
**Careful:** Do not create the Application Key / API Key with your personal user. Those keys would inherit your broader permissions.
:::

## Using in Integrations

Once you have the app and API key from the point above, you need the following:
* Configure the app and API keys as secrets (see [Secrets Management](../writing-integrations/secrets.md))
* Add the secrets in the `requiredSecrets` of the integration
* Use `fetch` to call the Datadog API for [Logs](https://docs.datadoghq.com/api/latest/logs/), [Monitors](https://docs.datadoghq.com/api/latest/monitors/) or other products.

See [Datadog integrations](/integrations/github-datadog-logs-alerts) for examples.

See [Datadog integration examples](/integrations/github-datadog-logs-alerts) for complete implementations.

### Example: Calling Datadog API from an integration

```javascript
// Secrets expected: DATADOG_API_KEY, DATADOG_APP_KEY
run: async function (context, secrets = {}) {
  const resp = await fetch('https://api.datadoghq.com/api/v2/monitors', {
    headers: {
      'DD-API-KEY': secrets.DATADOG_API_KEY,
      'DD-APPLICATION-KEY': secrets.DATADOG_APP_KEY,
      'Content-Type': 'application/json'
    }
  });

  if (!resp.ok) {
    logger.warn({ status: resp.status }, 'Datadog API call failed');
    return [];
  }

  const data = await resp.json();
  return [
    {
      type: 'text',
      content: `Fetched ${data?.data?.length || 0} monitors from Datadog`,
      icon: 'datadog', // <Icon name="datadog" size={16} /> - This is how the icon appears in the UI
      status: 'relevant'
    }
  ];
}
```
