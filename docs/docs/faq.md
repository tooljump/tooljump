---
id: faq
title: FAQ - Connecting Tools and Developer Experience | ToolJump
sidebar_label: FAQ
keywords: [tooljump faq, frequently asked questions, connecting tools, developer experience, security, self-hosted]
description: Get answers to common questions about ToolJump's self-hosted security, connecting tools architecture, and how our Knowledge as a Service platform improves developer experience.
canonical: https://tooljump.dev/docs/faq
---

import StructuredData from '@site/src/components/StructuredData';

<StructuredData type="FAQ" data={{}} />

# Frequently Asked Questions

## Security & Compliance

### Does ToolJump have SOC2/Hipaa certifications?

**No, and it's not needed!** ToolJump is **self-hosted** - you run it on your own infrastructure, so **you** are responsible for compliance, not us. This actually gives you **more control** over your security posture than most SaaS solutions.

- **Your data stays in your environment** - we never see or store any of your data
- **You control access** - integrate with your existing auth systems (Okta, Google Workspace, etc.)
- **You set the security standards** - use your own secrets management, firewalls, and monitoring
- **No vendor risk** - eliminate concerns about third-party data breaches or compliance gaps

### Is ToolJump secure for enterprise use?

**Absolutely.** ToolJump is built with enterprise security in mind:

- **VM sandboxing** for integration execution - integrations are treated as trusted code that goes through your code review process (see [Server Architecture](/docs/server-architecture) for details)
- **Read-only credentials by design** - integrations can only read data, never modify anything
- **HTTPS encryption** for all communication between extension and server
- **Input validation** and comprehensive security measures built-in
- **Battle-tested dependencies** using Node.js and React
- **Principle of least privilege** - credentials only have minimum required permissions

### What if someone adds malicious code to an integration?

**This is prevented through proper governance.** Since integrations are stored in **your GitHub repository** (not ours), they go through your normal code review process:

- All changes require team approval
- Code is auditable and versioned
- Follow your existing security policies
- No external dependencies on our infrastructure

### Where is my data stored?

**Nowhere on ToolJump's side.** ToolJump is completely self-hosted:
- Extension data stays in your browser
- Server runs on your infrastructure  
- Integrations live in your GitHub repos
- We have zero access to your data

### Can ToolJump access my cloud accounts or modify anything?

If you follow the best practices, no! ToolJump integrations:
- Must use **read-only credentials only**
- Cannot modify any resources in your tools
- Can only fetch information for display
- Follow the principle of least privilege

## Competitive Advantages

### Is ToolJump like a bookmarks bar?

**Nothing like it!** Bookmarks are static, personal, and manual. ToolJump is **dynamic, contextual, and organizational**:

| ToolJump | Bookmarks Bar |
|----------|---------------|
| ✅ **Dynamic content** - shows real-time data from your tools | ❌ Static links only |
| ✅ **Context-aware** - adapts to the exact page you're viewing | ❌ Same links everywhere |
| ✅ **Organizational** - deployed company-wide with shared knowledge | ❌ Personal only |
| ✅ **Automatic** - appears when relevant, no manual setup | ❌ Manual bookmarking required |
| ✅ **Evolving** - integrations improve over time with your stack | ❌ Stale and forgotten |
| ✅ **Intelligent** - shows logs, costs, alerts, deployment status | ❌ Just URLs |

### How is ToolJump different from developer portals?

**Developer portals require engineers to leave their workflow.** ToolJump brings knowledge **directly into the tools you already use**:

| ToolJump | Developer Portals |
|----------|-------------------|
| ✅ Works inside GitHub, AWS, Datadog | ❌ Another tab to remember |
| ✅ Context-aware insights | ❌ Static documentation |
| ✅ Instant, automatic | ❌ Manual navigation |
| ✅ Zero workflow disruption | ❌ Context switching required |

### Why not just use documentation?

**Static docs can't adapt to what you're doing right now.** ToolJump provides **live, contextual intelligence**:

- **Dynamic content** that changes based on the page you're viewing
- **Real-time data** from your actual tools (not stale documentation)
- **Automatic detection** of what service/repo you're working on
- **One-click navigation** to related resources across your entire stack

### How does ToolJump compare to other tool integration solutions?

**ToolJump is the only solution that works inside your existing tools for [connecting tools](/docs/connecting-your-tools-resources):**

- **No workflow disruption** - works within GitHub, AWS, Datadog, etc.
- **Self-hosted** - complete control over your data and security
- **Open source** - no vendor lock-in, fully customizable
- **Code-based integrations** - stored in Git, reviewable, versioned
- **Zero maintenance overhead** - no complex configurations or UI to manage
- **Knowledge as a Service** - delivers contextual information exactly where you need it

### Why not use an AI solution that indexes all company information?

**AI solutions have fundamental limitations for developer workflows.** While they can answer questions, they suffer from:

- **Users need to know what to ask** - AI requires you to formulate the right questions
- **Hallucination risk** - AI can provide incorrect or made-up information
- **Inconsistent answers** - Same question can get different responses each time
- **No context awareness** - Doesn't understand what you're currently working on
- **Generic responses** - Can't adapt to your specific tooling and workflows

**ToolJump is fundamentally different with its [Knowledge as a Service](/docs/knowledge-as-a-service) approach:**

| ToolJump | AI Solutions |
|----------|--------------|
| ✅ **Proactive** - shows relevant info automatically | ❌ Reactive - you must ask questions |
| ✅ **Context-aware** - knows what repo/service you're viewing | ❌ Context-blind - no awareness of current work |
| ✅ **Consistent** - same reliable results every time | ❌ Variable - different answers on repeat |
| ✅ **Actionable** - direct links to tools and resources | ❌ Informational - just text responses |
| ✅ **Customizable** - easy to modify and update workflows | ❌ Black box - hard to customize or debug |
| ✅ **Developer Experience** - designed for engineering workflows | ❌ Generic - not optimized for dev teams |

### What about tools like Zapier or IFTTT?

**Those are for end-users, not developers.** ToolJump is purpose-built for engineering teams:

| ToolJump | Zapier/IFTTT |
|----------|--------------|
| ✅ Developer-focused | ❌ General purpose |
| ✅ Context-aware | ❌ Trigger-based |
| ✅ Code-based (flexible) | ❌ UI-only (limited) |
| ✅ Self-hosted | ❌ SaaS only |
| ✅ Enterprise security | ❌ Consumer-grade |

## Technical Questions

### Do I need to be a developer to use ToolJump?

**For basic usage, no.** The Chrome extension works out-of-the-box with demo data. However, to connect your real tools, you'll need:

- **DevOps/Infrastructure team** to set up the server (1-5 days)
- **Senior engineers** to write integrations (1-5 days)
- **Anyone** can use it once set up

### What happens if my ToolJump server goes down?

**The extension gracefully degrades.** You'll simply see your tools without the context bar - no impact on your actual work. This is much better than having a critical service depend on an external vendor.

### Can ToolJump slow down my browser or the websites I visit?

**No performance impact.** ToolJump:
- Uses **debounced updates** to prevent excessive API calls
- **Isolated execution** - doesn't interfere with page JavaScript
- **Minimal resource usage** - lightweight React-based extension
- **Smart caching** - reduces redundant requests

### How do I know ToolJump is working correctly?

**Built-in debugging tools:**
- **Context overlay** shows exactly what data is being collected
- **Extension settings** provide connection status and logs
- **Integration debugging** helps troubleshoot custom integrations
- **Demo mode** lets you test without real integrations

## Business Impact

### What's the ROI of implementing ToolJump?

**Massive productivity gains.** Typical results:
- **5-10 minutes saved per context switch** (now takes seconds)
- **Multiply by 50-200 engineers** = thousands of hours saved monthly
- **Faster onboarding** - new engineers productive immediately
- **Fewer mistakes** - guided workflows prevent errors
- **Better DevEx** - happier engineers, higher retention

### How long does implementation take?

**Weeks, not months:**
- **Extension setup**: 5 minutes per engineer
- **Server deployment**: 1-5 days (depending on your infrastructure)
- **First integrations**: 1-5 days (depending on complexity)


### Do I need to hire additional staff to maintain ToolJump?

**No additional headcount required.** ToolJump is designed to be:
- **Self-maintaining** once set up
- **Code-based** - fits into existing development workflows
- **Version-controlled** - changes go through normal review processes
- **Minimal overhead** - just like any other internal tool

[Fast-track ToolJump in your company](/docs/implement)


### What if we outgrow ToolJump?

**You own everything.** Since ToolJump is:
- **Open source** - full access to code
- **Self-hosted** - runs on your infrastructure
- **Standard technologies** - Node.js, React, Express
- **No vendor lock-in** - you can modify or replace as needed

## Getting Started

### Can I try ToolJump without any setup?

**Yes!** Download the Chrome extension and it runs in **Demo Mode** immediately. You can see ToolJump in action on our demo repository without any server setup.

### What tools does ToolJump support out of the box?

**Currently optimized for:**
- **GitHub** - repositories, pull requests, issues
- **AWS** - Lambda, DynamoDB, S3, EC2, and more
- **Any website** - via generic adapter (URL-based)

**Easily extensible to:**
- Datadog, PagerDuty, CircleCI, GitLab, Azure, GCP
- Any tool with an API
- Custom internal tools

### Do you provide implementation support?

**Yes!** We offer professional implementation services to get you up and running quickly:

- **Seamless integration** with your existing auth systems
- **Tailored implementation** focused on your biggest bottlenecks  
- **Security compliance** following your organization's standards
- **Team enablement** and training for ongoing maintenance

[Contact us](/docs/implement) for a free consultation to see how ToolJump can accelerate your team's productivity.

### Is there a community or support forum?

**Yes!** Join our growing community:
- **GitHub Discussions** for technical questions and sharing integrations
- **Open source contributions** welcome
- **Regular updates** and new features
- **Community-driven** integrations and best practices

---

*Still have questions? [Get in touch](/docs/implement) or join our [GitHub community](https://github.com/tooljump/tooljump/discussions).*
