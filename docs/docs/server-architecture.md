---
id: server-architecture
title: Server Architecture
sidebar_label: (2/2) Server Architecture
keywords: [tooljump server, server architecture, integration engine, developer tool server, self-hosted]
description: Deep dive into ToolJump's server architecture including the integration engine, workflow processing, and how it orchestrates developer tool connections.
---

# ToolJump Server Architecture

The ToolJump Server is the core orchestration engine that processes integration requests, executes workflows, and manages the entire integration ecosystem.

The server is responsible with:
* processes the requests from the ToolJump Chrome extension via HTTP
* loads all integration and is responsible for deciding which one runs for a given context
* runs the integrations in an isolated manner
* manages secrets required for connecting to external tools from integrations
* caches results of integrations for performance reasons
* responsible for authentication

As every company runs their services in their own way, the ToolJump server was designed to be extremely flexible and extensible.

If you need help setting up ToolJump in your organisation with the help of the ToolJump authors, you can reach out [here](./implement).

Next, let's go one by one and explore in detail how it happens:

## Server responsibilities

### Process the requests from ToolJump Chrome extension

The server uses the popular Express framework to process a number of endpoints required by the extensions.

The most important one is the `/context` endpoint, which receives the [context](./core-concepts) from the Chrome extension, and returns the links and insights relevant for the current page

### Loads all integrations and is responsible for deciding which one runs for a given context

Integrations are standalone JavaScript files, which can be loaded by the server in two ways:
* locally, as files (if using the `@tooljump/integration-fs` package)
* from a GitHub repository (if using the `@tooljump/integration-github` packages)

:::tip
To benefit from the advantages of source control (auditing, reviewing, history, etc), we recommend using the GitHub method
:::

:::tip
If you want to load the integrations from another source (eg: S3, DB, etc), you can create your own integration by inheriting from `Integrations` from `@tooljump/common` package and implementing all the required methods.
:::

### Runs the integrations in an isolated manner

Integrations are JavaScript files which are ran by the server using the native node `vm` module, as part of the `@tooljump/runner-vm`.

:::warn
The native `VM` node module does not offer full isolation, so if you do not store your integrations in Github and use a code review process (just like you should use for the rest of your organisation), an integration can exit outside of its isolation if not reviewed.
:::

When using the GitHub integration method above, this creates a balance between convenience, functionality and security.

:::note
If for whatever reason you want full isolation from the node process, you have two options:
1. Create a remote runner that just runs the integrations
2. Use `isolated-vm` package, however this reduces your ability to import SDKs or to pass custom modules from the server inside the module
:::

### Manages secrets required for connecting to external tools from integrations

Integrations require secrets to be able to connect to external tools.

For example, to find out when a given GitHub repo was last released to production, the integration would need to access the CI/CD system.

To store this secrets, ToolJump provides the package `@tooljump/secrets-env`, which reads the secrets from the process' env variables.

However, you can easily create secrets wrapper by using systems like AWS Secrets Manager, Vault, etc, by inheriting the `Secrets` class from `@tooljump/common` and implementing the `get` and `load` methods.

### Caches results of integrations for performance reasons

In order to improve the performance and reduce the load of the server and external tools, ToolJump provides caching functionality.

For this, ToolJump provides the package `@tooljump/cache-local`, which stores the cache locally in a hashmap.

However, you can easily create cache wrapper for existing cache systems (eg: Redis, Memcached) by inheriting the `Cache` class from `@tooljump/common` and implementing the `get`/`set` methods.

### Responsible for authentication

For security reasons, every request must be authenticated. ToolJump provides a simple authentication based on a fixed token with the `@tooljump/auth-token`.

A more advanced authentication system (eg: Okta, Google Workspaces, emai/password) can be created by extending `Auth` class and by implementing the `middleware` method.

:::tip
To ensure an additional layer of security, you can limit the access from the service's firewall/api gateway only to the IPs in your company.
:::
