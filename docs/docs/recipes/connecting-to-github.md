---
id: connecting-to-github
title: Connecting to GitHub
keywords: [connecting to github, github integration, source control integration, repository integration, tooljump github]
description: Learn how to connect GitHub repositories, pull requests, and issues with ToolJump to improve developer workflow and eliminate context switching.
---

import Icon from '@site/src/components/Icon';

# Connecting to GitHub

<Icon name="github" size={32} /> GitHub is a developer platform for hosting code, collaborating via pull requests and issues, and automating workflows.

## Correlating other tools with GitHub

Suggested reading: Best practices for uniformly tagging and correlating resources across your organization.

To best leverage GitHub, adopt consistent conventions so other tools can reliably find and relate your repositories, issues, and pull requests.

Examples:
- <Icon name="link" size={16} /> **Repository topics**: add topics like `service-webshop` and `team-platform` to repositories for discoverability.  
- <Icon name="link" size={16} /> **Labels**: use standardized labels such as `service:webshop`, `priority:high`, `component:checkout` across issues and pull requests.  
- <Icon name="link" size={16} /> **Branch protection + CODEOWNERS**: ensure ownership and review paths reflect team structure.  
- <Icon name="link" size={16} /> **Issue/PR templates**: capture metadata (service, component, severity) in a structured manner.  
- <Icon name="link" size={16} /> **Links**: reference issue keys (e.g., JIRA), PagerDuty services, or runbook URLs in PR descriptions for easy correlation.

## Authenticating to GitHub

Depending on your setup, there are several approaches, each with pros and cons. Choose the one that best fits your scenario:

### Option 1: GitHub App installation (recommended)

Use this if:
- ✅ You want granular, least‑privilege, revocable access scoped to selected repositories or organizations

Create a **GitHub App** in your organization, grant only the permissions required (e.g., `Contents: Read`, `Issues: Read`), and install it on the necessary repositories or org(s). Your service uses the app’s **private key** to mint a short‑lived JWT, exchanges it for an **installation access token** (~1 hour), and calls the API.

#### Benefits
- Short‑lived, auto‑rotated tokens; no long‑lived PATs.  
- Fine‑grained permissions and per‑repo install scope.  
- Easy to revoke by uninstalling or changing permissions.  

#### Example: Node.js with Octokit (GitHub App)
```js
import { App } from "octokit";

const app = new App({
  appId: process.env.GH_APP_ID!,
  privateKey: process.env.GH_APP_PRIVATE_KEY!,
});

// Installation ID of your app on a repo/org
const installationId = Number(process.env.GH_INSTALLATION_ID);

const octokit = await app.getInstallationOctokit(installationId);
const { data: issues } = await octokit.rest.issues.listForRepo({
  owner: "my-org",
  repo: "my-repo",
  state: "open",
  per_page: 50,
});

console.log(issues.map(i => `#${i.number} ${i.title}`));
```

### Option 2: Classic Personal Access Token (PAT)

Use this if:
- ✅ You cannot use a GitHub App and your code does not run in GitHub‑hosted environments (no `GITHUB_TOKEN` available)

Create a **classic PAT** from your GitHub settings with the minimal scopes needed (for read‑only access, consider `repo:read`/`public_repo`, `read:org` if org data is needed, etc.). Store the token securely and rotate it regularly.

#### Notes
- Classic PATs are broad; prefer GitHub Apps or fine‑grained PATs when possible.  
- Scope minimally and restrict to what you truly need.  
- Store in a **secrets manager**, for example in `@tooljump/secrets-env`. More information [here](../writing-integrations/secrets.md)

#### Example: Node.js with classic PAT
```js
import { Octokit } from "octokit";

const octokit = new Octokit({ auth: process.env.GITHUB_CLASSIC_TOKEN });
const { data: prs } = await octokit.rest.pulls.list({ owner: "my-org", repo: "my-repo", state: "open" });
console.log(prs.length);
```

### Option 3: Fine‑grained Personal Access Token (last resort)

If an app install or classic personal access token is not feasible, create a **Fine‑grained PAT** scoped to specific repositories with minimal permissions. Store it securely and rotate regularly. Avoid classic PATs unless absolutely necessary.

#### Risks
- ❌ Long‑lived secrets can be leaked or compromised.  
- ❌ Manual rotation and broader blast radius if over‑scoped.  

#### Hardening Measures
- Scope to selected repositories only; grant minimal permissions.  
- Store in a **secrets manager**, for example in `@tooljump/secrets-env`. More information [here](../writing-integrations/secrets.md)  
- Rotate frequently (e.g., every 30 - 60 days); monitor access logs.  

#### Example: Node.js with fine‑grained PAT
```js
import { Octokit } from "octokit";

const octokit = new Octokit({ auth: process.env.GITHUB_FINEGRAINED_TOKEN });
const { data } = await octokit.rest.repos.get({ owner: "my-org", repo: "my-repo" });
console.log(data.default_branch);
```

## Using the GitHub API to retrieve data from GitHub

Use the official **REST v3** or **GraphQL v4** APIs. Prefer conditional requests and pagination to stay within rate limits.

Best practices:
- **ETags and caching**: Send `If-None-Match` to leverage 304 responses.  
- **Pagination**: Use `per_page` and follow `Link` headers; in GraphQL, use cursors.  
- **Abuse/rate limits**: Back off on `403` with `X-RateLimit-Remaining: 0` and respect `Retry-After`.  
- **Minimal scopes**: Request only the permissions you need.  

Example: list commits via REST (Node.js):
```js
import { Octokit } from "octokit";

const octokit = new Octokit({ auth: process.env.GITHUB_FINEGRAINED_TOKEN || process.env.GITHUB_CLASSIC_TOKEN });
const res = await octokit.rest.repos.listCommits({ owner: "my-org", repo: "my-repo", per_page: 20 });
console.log(res.data.map(c => c.sha.slice(0, 7)));
```
