---
id: connecting-to-circleci
title: Connecting to CircleCI
keywords: [connecting to circleci, circleci integration, ci cd integration, continuous integration, tooljump circleci]
description: Connect CircleCI continuous integration with ToolJump to provide build status, deployment information, and pipeline insights in your development workflow.
---

import Icon from '@site/src/components/Icon';

# Connecting to CircleCI

<Icon name="circleci" size={32} /> CircleCI is a CI/CD platform for building, testing, and deploying code. This guide covers how to correlate your resources and authenticate to the CircleCI API to read pipeline/workflow data.

## Correlating other tools with CircleCI

Suggested reading: Best practices for uniformly tagging and correlating resources across your organization.

To best leverage CircleCI across tools, use consistent naming and metadata conventions:

- <Icon name="link" size={16} /> Project naming: align CircleCI projects with your VCS repos (e.g., `my-org/my-repo`).  
- <Icon name="link" size={16} /> Contexts: name contexts with service/team (e.g., `svc-webshop-prod`) to signal ownership.  
- <Icon name="link" size={16} /> Pipeline parameters: include `service`, `env`, `component` parameters to make runs filterable.  
- <Icon name="link" size={16} /> Workflow/job names: include service/component identifiers (e.g., `build-webshop`, `deploy-checkout`).  
- <Icon name="link" size={16} /> Links: add links in job output or notifications to incidents, runbooks, and dashboards.

## Authenticating to CircleCI

Choose the method that best fits your scope and security posture.

### Option 1: Project API Token (recommended for single project)

Use this if:
- ✅ You only need access to a single project, and want easy revocation with minimal blast radius

Create a **Project API Token** in the project settings with read permissions. Use it via the `Circle-Token` header when calling the v2 API.

#### Benefits
- Scoped to one project; easy to rotate/revoke.  
- Works with Insights and core v2 endpoints.  
- Least privilege compared to user-wide tokens.

#### Example: List recent pipelines (Node.js)
```js
// Requires Node 18+ (global fetch)
const token = process.env.CIRCLECI_PROJECT_TOKEN; // store securely
const projectSlug = 'gh/my-org/my-repo'; // gh|bb provider

const res = await fetch(`https://circleci.com/api/v2/project/${projectSlug}/pipeline?branch=main`, {
  headers: { 'Circle-Token': token }
});
if (!res.ok) throw new Error(`HTTP ${res.status}`);
const data = await res.json();
console.log((data.items || []).map(p => `${p.id} ${p.state}`));
```

### Option 2: Personal API Token (multi-project; broader scope)

Use this if:
- ✅ You need to read data across multiple projects or org-wide Insights

Create a **Personal API Token** from your CircleCI user settings. Scope is bound to your user and can span many projects - treat it as sensitive and rotate regularly.

#### Risks
- ❌ Broader access surface (user-wide).  
- ❌ Long‑lived secret unless you rotate.  

#### Hardening Measures
- Use read-only flows; do not grant unnecessary permissions.  
- Store in a **secrets manager**, for example in `@tooljump/secrets-env`. More information [here](../writing-integrations/secrets.md)  
- Rotate frequently (e.g., every 30 - 60 days) and monitor usage.

#### Example: Insights workflows (Node.js)
```js
const token = process.env.CIRCLECI_PERSONAL_TOKEN; // store securely
const projectSlug = 'gh/my-org/my-repo';

const res = await fetch(`https://circleci.com/api/v2/insights/${projectSlug}/workflows?branch=main`, {
  headers: { 'Circle-Token': token }
});
if (!res.ok) throw new Error(`HTTP ${res.status}`);
const data = await res.json();
console.log((data.items || []).map(w => `${w.name}:${w.status}`));
```
