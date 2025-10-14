# ToolJump

**Knowledge as a Service for Engineering Teams**

---

## What is ToolJump?

Modern software engineering runs on an ecosystem of tools: GitHub, AWS, GCP, Azure, Datadog, PagerDuty, Terraform, CI/CD pipelines, feature flags, and many more. These tools are powerful but have a major flaw: **they're not connected and don't talk to each other**.

**The result?**
- Engineers spend countless hours context-switching, clicking through tabs, and hunting for information, losing focus and negatively impacting developer productivity.
- Critical knowledge lives in Slack threads, stale documentation, or in the heads of a few senior engineers, negatively affecting the overall developer experience.
- Onboarding new engineers takes weeks, and mistakes happen more often than anyone admits (debugging the wrong environment, shipping to production instead of staging).

For leaders, this translates into **millions lost every year in wasted engineering time, slower delivery, and costly mistakes** - a silent tax on every software project.

### ToolJump's Solution

ToolJump brings **Knowledge as a Service** directly into the tools your engineers already use.

Imagine a single bar that follows you across your tools - GitHub, AWS, Datadog, CI/CD - and instantly shows you valuable insights by connecting them together into one ecosystem. **No searching, no bookmarks, no context switching - just answers where you need them.**

Think of it as a **GPS for your engineering tools**: wherever you are, ToolJump shows you the path forward - whether it's debugging logs, exploring related infrastructure, or finding the right docs. All without leaving the screen you're already on.

### Real-World Examples

- Jump instantly from a GitHub repo to the right logs in your monitoring system
- See a clear label in your cloud provider when you're working in production vs staging
- Navigate from a CI/CD pipeline to the related infrastructure in your cloud provider with a single click
- Discover the URLs of every service, for every environment, by just looking at its repository
- Define your company's knowledge base as small, reviewable code snippets stored in source control - safe, auditable, and versioned

### The Impact

With ToolJump, **teams spend less time wandering around and more time shipping**. That means higher focus, higher productivity, faster delivery with fewer operational mistakes, and greater output with the same headcount.

- What used to take 5-10 minutes of tool-hopping now takes a few seconds. Multiply that by 10, 50, or 200 engineers, and the impact becomes massive across the entire organization.
- What used to require tribal knowledge is now encoded and shared across the entire organization.
- What used to be risky guesswork is now a guided, reliable, deterministic path.

---

## Getting Started: 3 Simple Steps

### Step 1: Install the Chrome Extension

Install the ToolJump Chrome extension from the Chrome Web Store. The extension installs in **Demo Mode**, so you can see ToolJump in action immediately.

**Make sure to pin the extension** to your Chrome toolbar for easy access.

[Learn more →](http://localhost:3001/docs/getting-started#step-1-install-the-chrome-extension)

---

### Step 2: Try the Demo

Visit the demo repository to see ToolJump in action. You'll see a context bar at the top of the GitHub page showing:

- **Real-time alerts** from your monitoring tools
- **Quick links** to logs, costs, and deployment status
- **Team information** like who's on-call
- **Environment URLs** for different deployments

This is demo data to show you what's possible. To connect your real tools, continue to Step 3.

[Learn more →](http://localhost:3001/docs/getting-started#step-2-try-the-demo)

---

### Step 3: Set Up Your Server Locally

To connect your actual tools and data, you'll need to run your own ToolJump server.

**Prerequisites:**
- Node.js 20+
- Yarn or NPM

**Quick Setup:**

```bash
# Create your server
npx create-tooljump

# Start the server
npm run dev
```

**Configure the extension:**
- Open ToolJump extension settings
- Turn off "Demo Mode"
- Enter your server URL and the secure token you chose at step 1

**Test the connection:**
Visit your GitHub repository and you should see your ToolJump bar!

The server comes with demo integrations that showcase what's possible. To adapt it to your company and workflows, start building custom integrations.

[Learn more →](http://localhost:3001/docs/getting-started#step-3-set-up-your-server-locally)

---

## Architecture

ToolJump is comprised of 3 main components:

### 1. ToolJump Chrome Extension
- Understands the pages you visit
- Sends context summary to the ToolJump server
- Displays insights and links in a context bar
- Deployed in user's browser (client-side)

### 2. ToolJump Server
- Receives context data from the extension
- Runs user-defined integrations
- Returns results to the extension
- Deployed on your cloud/on-prem infrastructure

### 3. ToolJump Integrations
- Provides the logic for connecting tools together
- Written in JavaScript
- Stored in your GitHub repository
- Maintained by your engineering team

**Important:** ToolJump is self-hosted. You host it yourself and are responsible for deployment, security, monitoring, and storing secrets. We do not store anything on our side.

[Learn more about architecture →](http://localhost:3001/docs/architecture)

---

## Core Concepts

### Contexts

A **context** is a JSON object containing the most important information from the currently visited website. It's produced by the ToolJump Chrome Extension and sent to the server.

For example, when visiting a Lambda function in AWS Console:

```json
{
  "url": "https://eu-central-1.console.aws.amazon.com/lambda/home?region=eu-central-1#/functions/my-test-lambda-function?tab=code",
  "type": "aws",
  "global": {
    "accountId": "123456789012"
  },
  "scope": {
    "region": "eu-central-1"
  },
  "service": {
    "name": "lambda",
    "section": "functions",
    "resourceName": "my-test-lambda-function",
    "arn": "arn:aws:lambda:eu-central-1:123456789012:function:my-test-lambda-function"
  }
}
```

### Integrations

**Integrations** are JavaScript files that provide links or insights for a given context. They analyze the context, connect to external tools (like GitHub, Datadog, PagerDuty), and return relevant information to display in the context bar.

**Example Integration:**

```javascript
module.exports = {
    metadata: {
        name: 'hello-world',
        description: 'A simple hello world integration',
        match: {
            contextType: 'github'
        }
    },
    run: async function () {
        return [
            {
                type: 'text',
                content: 'Hello World!',
                status: 'important'
            }
        ];
    }
};
```

[Learn more about core concepts →](http://localhost:3001/docs/core-concepts)

---

## Writing Integrations

Integrations are the heart of ToolJump. They connect your tools and provide contextual information exactly where you need it.

**Getting Started:**
1. Create a file with `.integration.js` extension
2. Define metadata (name, description, when to run)
3. Implement the `run` function to fetch and return data
4. Store in your GitHub repository

**Result Types:**
- **Text** - Display simple information
- **Link** - Clickable links to other tools
- **Dropdown** - Multiple links grouped together

**Available Integrations:**

Browse our gallery of pre-built integrations connecting 10+ tools:
- GitHub ↔ AWS Infrastructure
- GitHub ↔ Datadog Logs & Alerts
- GitHub ↔ CircleCI Deployments
- AWS Lambda ↔ GitHub Code
- AWS Lambda ↔ PagerDuty On-call
- And many more...

[Start writing integrations →](http://localhost:3001/docs/writing-integrations)

[Browse integration gallery →](http://localhost:3001/integrations)

---

## Security

ToolJump is designed with security as a core principle:

- **Self-hosted**: You control your data and infrastructure
- **No external storage**: All data stays within your organization
- **Credential security**: Secrets stored locally, never transmitted
- **Input validation**: Comprehensive validation of all inputs
- **HTTPS recommended**: Secure communication in production

**Security Best Practices:**
- ✅ Use HTTPS in production
- ✅ Implement strong authentication
- ✅ Store integrations in GitHub with code review
- ✅ Use read-only credentials with least privilege
- ✅ Enable rate limiting
- ✅ Keep dependencies updated

[Learn more about security →](http://localhost:3001/docs/security)

---

## Deployment Options

ToolJump can be deployed in various environments:

### Local Development
```bash
npx create-tooljump
npm run dev
```

### VPS Deployment
- Direct Node.js application
- Use process managers (pm2, systemd)
- Configure HTTPS with Let's Encrypt
- Set up reverse proxy (Nginx)

### Docker Deployment
```bash
docker build -t tooljump .
docker run -p 3000:3000 --env-file .env tooljump
```

### Kubernetes Deployment
- Production-grade orchestration
- Auto-scaling and self-healing
- Rolling updates with zero downtime
- ConfigMaps and Secrets management

[Learn more about deployment →](http://localhost:3001/docs/deploying)

---

## Fast-track Implementation in Your Company

While ToolJump is fully open source and free to use, implementing it across your organization with battle-tested DevEx expertise can save weeks of trial and error. Professional implementation includes seamless integration with your internal auth, tailored rollout based on your biggest bottlenecks, team enablement, and enterprise features with ongoing support.

[Learn more about professional implementation →](http://localhost:3001/implement)

---

## Documentation

**Full documentation is available at:** http://localhost:3001/docs/

### Quick Links
- [Getting Started](http://localhost:3001/docs/getting-started)
- [Core Concepts](http://localhost:3001/docs/core-concepts)
- [Writing Integrations](http://localhost:3001/docs/writing-integrations)
- [Integration Gallery](http://localhost:3001/integrations)
- [Architecture](http://localhost:3001/docs/architecture)
- [Security](http://localhost:3001/docs/security)
- [Deployment](http://localhost:3001/docs/deploying)
- [FAQ](http://localhost:3001/docs/faq)

---

## Requirements

- **Node.js**: Version 20 or higher
- **Yarn**: Package manager (or NPM)
- **Chrome Browser**: For the extension

---

## Contributing

ToolJump is fully open source. Contributions are welcome!

---

## License

See [LICENSE](./LICENSE) file for details.

---

*All product names, logos, trademarks, service marks, and any associated images or screenshots used or referenced in this project are the property of their respective owners. Any such use is for identification and reference purposes only and does not imply any affiliation with, endorsement by, or sponsorship of ToolJump by those owners.*

