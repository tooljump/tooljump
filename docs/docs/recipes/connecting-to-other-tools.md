---
id: connecting-to-other-tools
title: Connecting to other tools
keywords: [connecting other tools, custom tool integration, generic integration, tooljump custom tools, developer tool integration]
description: Learn how to connect any custom or third-party developer tool with ToolJump using generic adapters and custom integration patterns.
---

import Icon from '@site/src/components/Icon';

# Connecting to other tools

<Icon name="link" size={32} /> While this guide cannot cover every available tool, this section provides general guidance and best practices for integrating with external services.

<Icon name="link" size={16} /> **Recommended reading:** [Best practices for uniformly tagging and correlating resources across your organization](../connecting-your-tools-resources)

## Authentication

The standard approach for connecting to external tools involves generating a service access token with minimal required permissions. Ideally, use read-only access limited to only the specific resources your integrations need to access.

<Icon name="link" size={16} /> Store the authentication token securely using your configured ToolJump secrets adapter, then reference it from within your integration code.

<Icon name="link" size={16} /> Select the authentication method that aligns with your security requirements and operational scope.

## Data Retrieval

External tools typically provide either a REST API or a Node.js SDK for data access.

### Using REST APIs

The most direct approach is to use the `fetch` function to make HTTP requests. This method requires you to handle request construction, authentication headers, and response parsing manually.

### Using SDKs

If the tool provides a Node.js SDK, you can leverage its built-in functionality for easier integration. Ensure you install the SDK as a dependency in your root-level `package.json` file, as it must be available in the integration runtime environment.
