---
id: connecting-to-gitlab
title: Connecting to GitLab
keywords: [connecting to gitlab, gitlab integration, source control integration, repository integration, tooljump gitlab]
description: Connect GitLab repositories, merge requests, and CI/CD pipelines with ToolJump to streamline your GitLab-based development workflow.
---

# Connecting to GitLab

GitLab is a platform for hosting code, collaborating via merge requests and issues, and automating CI/CD.

## Correlating other tools with GitLab

Suggested reading: Best practices for uniformly tagging and correlating resources across your organization.

To best leverage GitLab, adopt consistent conventions so other tools can reliably find and relate your groups, projects, issues, and merge requests.

Examples:
- **Project tags**: add tags like `service-webshop` and `team-platform` for discoverability.  
- **Labels**: use standardized labels such as `service:webshop`, `priority:high`, `component:checkout` across issues and merge requests.  
- **CODEOWNERS + approvals**: ensure ownership and approval rules reflect team structure.  
- **Issue/MR templates**: capture metadata (service, component, severity) in a structured manner.  
- **Links**: reference incident IDs, runbooks, or external system identifiers in descriptions for easy correlation.

## Authenticating to GitLab

Depending on your setup, there are several approaches, each with pros and cons. Choose the one that best fits your scenario:

### Option 1: Project/Group Access Token (recommended)

Use this if:
- ✅ You want granular, revocable access scoped to a specific project or group

Create a **Project Access Token** or **Group Access Token** with minimal scopes (e.g., `read_api`, `read_repository`). Use it as a bearer token to call the API. These tokens function like a “robot user” limited to the chosen scope.

#### Benefits
- Scoped to a single project or group; easy to revoke.  
- Minimal required scopes (least privilege).  
- Works for both Git operations and the REST/GraphQL APIs (where supported by scopes).

#### Example: Node.js with `@gitbeaker/rest`
```js
import { Gitlab } from '@gitbeaker/rest';

const api = new Gitlab({
  host: process.env.GITLAB_HOST || 'https://gitlab.com',
  token: process.env.GITLAB_ACCESS_TOKEN, // project/group access token
});

// List open issues in a project (namespace/name encoded)
const projectId = encodeURIComponent('my-group/my-project');
const issues = await api.Issues.all({ projectId, state: 'opened', perPage: 50 });
console.log(issues.map(i => `#${i.iid} ${i.title}`));
```

### Option 2: Personal Access Token (PAT)

Use this if:
- ✅ You cannot use a project/group token and need cross‑project access with minimal scopes

Create a **Personal Access Token** with the minimal scopes needed (e.g., `read_api`, `read_repository`, `read_user`). Store it securely and rotate regularly.

#### Risks
- ❌ Long‑lived secrets can be leaked or compromised.  
- ❌ May grant broader access than intended if scoped widely.  

#### Hardening Measures
- Limit scopes and set an expiration date.  
- Store in a **secrets manager**, for example in `@tooljump/secrets-env`. More information [here](../writing-integrations/secrets.md)  
- Rotate frequently (e.g., every 30 - 60 days); monitor access logs.  

#### Example: Node.js with PAT
```js
import { Gitlab } from '@gitbeaker/rest';

const api = new Gitlab({
  host: process.env.GITLAB_HOST || 'https://gitlab.com',
  token: process.env.GITLAB_PAT, // personal access token
});

const projectId = encodeURIComponent('my-group/my-project');
const repoTree = await api.RepositoryTree.all(projectId, { path: 'read-prefix', perPage: 100 });
console.log(repoTree.map(e => e.path));
```

### Option 3: CI Job Token (when running in GitLab CI)

Use this if:
- ✅ Your code runs inside **GitLab CI/CD** and can rely on the short‑lived `CI_JOB_TOKEN`

`CI_JOB_TOKEN` is injected into jobs and can be used for certain API calls and package/registry operations. Configure the project to trust `CI_JOB_TOKEN` for the necessary endpoints and keep permissions minimal.

```js
import { Gitlab } from '@gitbeaker/rest';

const api = new Gitlab({
  host: process.env.GITLAB_HOST || 'https://gitlab.com',
  jobToken: process.env.CI_JOB_TOKEN, // sends JOB-TOKEN header for supported endpoints
});

const projectId = encodeURIComponent('my-group/my-project');
const pipelines = await api.Pipelines.all(projectId, { perPage: 20 });
console.log(pipelines.map(p => `${p.id}:${p.status}`));
```

## Using the GitLab API to retrieve data from GitLab

Use the **REST API v4** or **GraphQL**. Prefer pagination and caching where possible.

Best practices:
- **Pagination**: Use `per_page`/`page` parameters; the API returns pagination headers.  
- **Rate limits/abuse limits**: Back off on 429/403 and respect `RateLimit-*` headers.  
- **Minimal scopes**: Request only the scopes you need (`read_api`, `read_repository`, etc.).  
- **Project IDs**: Many endpoints require a numeric project ID; for namespace/name, URL‑encode as `my-group%2Fmy-project`.

Example: list merge requests via REST (Node.js):
```js
import { Gitlab } from '@gitbeaker/rest';

const api = new Gitlab({ host: 'https://gitlab.com', token: process.env.GITLAB_ACCESS_TOKEN || process.env.GITLAB_PAT });
const projectId = encodeURIComponent('my-group/my-project');
const mrs = await api.MergeRequests.all({ projectId, state: 'opened', perPage: 20 });
console.log(mrs.map(m => `!${m.iid} ${m.title}`));
```
