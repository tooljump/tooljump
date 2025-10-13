---
id: security
title: Security
sidebar_label: Security
---

# Security

This document outlines Tooljump's security architecture, best practices, and security considerations for deployment and operation.

:::info
ToopJump is self-hosted. You can host it yourself, and you are responsible for its deployments, security, monitoring and storing the secrets for the tools that ToolJump communicates with. We do not store anything on our side.
:::

## Security Overview

Tooljump is designed with security as a core principle, implementing multiple layers of protection to ensure your integrations and data remain secure. Our security approach is informed by enterprise-grade security requirements and industry best practices.

This document covers the following security domains:
1. **Frontend Security** - Chrome Extension security measures
2. **Backend Security** - Server and integration security
3. **System Security** - Overall security posture
4. **Production Security** - Deployment and operational security

:::warning
The security practices described here assume you are running an official, supported version of Tooljump downloaded from the official repository. Modifying Tooljump or obtaining modified copies may compromise security.
:::

:::tip
Beyond the specific security features and recommendations provided for Tooljump, it is essential to maintain strong general security hygiene, just as you would for any other services or infrastructure in your organization. This includes practices such as keeping all systems and dependencies up to date, enforcing strong authentication and access controls, regularly monitoring for vulnerabilities, performing security reviews, and following your company's established security policies and incident response procedures. Adhering to these broader security best practices helps ensure that Tooljump remains a secure component within your overall technology environment.

:::

## Frontend Security

### Chrome Extension Permissions

The Tooljump Chrome extension requires permissions to read content from GitHub and AWS websites. Additional permissions may be requested if you build integrations that operate on other websites and you as a user will need to manually enable them in the extension's "Settings -> Providers" section

### Data Collection and Processing

The extension collects contextual information from web pages using URLs and DOM elements to create page context. This context is transmitted to the server for processing.

:::tip
To view what information is collected for a specific page, enable the **Context overlay** from the extension's Settings → Debugging panel.
:::

### Script Execution and Isolation

The extension does not execute inline scripts on injected pages. Modern websites implement Content Security Policy (CSP), which prevents scripts from accessing or modifying the JavaScript state of the current page.

### Extension permissions

The ToolJump Chrome extention requires the following permissions:
* Page content access for github.com and *.aws.amazon.com - required for reading information from the page and sending it over to the server for obtaining insights
* Optional permissions, which can be activated by user manually, per website, based on integrations running outside of the domains above. The allowed optional websites are visible in the "Providers" section of "Settings"
* Scripting permission - required to inject the ToolJump context bar in web pages
* Active tab - required to receive events about the current tab (eg: tab ready, start injecting context bar)
* Storage - to store the extension's settings (eg: server, token, debug on/off, etc)

### UI Injection and Styling

The Tooljump interface is injected either at the top of the page (Integrated mode) or within the body (Floating mode). The injected interface is self-contained with isolated styles to prevent any impact on the host webpage.

### Credential Storage

Credentials are stored locally within your Chrome browser and are not synchronized across devices. This local storage approach reduces the risk of credential exposure.

### Frontend library

ToolJump uses React (developed by Meta more than 10 years ago), which is a battle tested, production grade library for frontend. React handles content rendering ensuring that only safe content can be rendered in the browser.

## Backend Security

### Server Foundation

The Tooljump server is built on Express.js, providing a secure, stable, and extensible foundation for handling integration requests.

### Integration Isolation

Custom integrations are executed using Node.js's VM module, which provides process isolation. For detailed information about this architecture, see [Server Architecture](./server-architecture#runs-the-integrations-in-an-isolated-manner).

### Dependency Security

Integrations can import various packages to interact with external tools. Your Tooljump server's security is dependent on the security of these imported SDKs. We recommend:

- Enabling GitHub's vulnerability scanner for your Tooljump server repository
- Regularly updating dependencies to address security vulnerabilities
- Hosting integration files in GitHub for code review and approval processes

:::tip
Store your integration files in GitHub to enable team review and approval processes, just like any other code in your organization.
:::

### Secret Management

Integrations requiring external tool access need appropriate secrets.

:::danger
**Never hardcode secrets in your code.** Use Tooljump's [secrets functionality](./writing-integrations/secrets) for secure secret management.
:::

:::danger
**Apply the principle of least privilege.** Grant only the minimum permissions necessary for required operations.
:::

## System Security

### Dependency Management

Tooljump leverages mature, battle-tested Node.js packages and utilizes GitHub's vulnerability scanner to identify and address potential security vulnerabilities promptly.

### Input Validation

Tooljump implements comprehensive input validation to ensure data received from the extension is properly formatted and safe for processing.

## Production Security

While Tooljump is designed with security in mind, proper deployment practices are essential for maintaining security in production environments.

### Essential Security Measures

✅ **Use HTTPS** - Deploy Tooljump with HTTPS to secure communication between the extension and server

✅ **Implement Network Access Controls** - If your organization uses IP-based security (e.g., Netskope, Zscaler), restrict Tooljump access to your organization's IP ranges via firewall rules

✅ **Use Strong Authentication** - Implement strong, unique passwords that are not easily guessable

✅ **Enable Rate Limiting** - Implement rate limiting to prevent abuse and limit requests from individual IP addresses

✅ **Maintain System Security** - Keep your operating system updated and properly configure firewalls when hosting on VPS, bare metal, or similar infrastructure

## Security Scenarios

### Malicious Integration Code

**Q**: What happens if someone adds malicious code to an integration?

**A**: As with any code from your organization, integrations should be stored in GitHub to enable team review and approval processes. This ensures that all code changes are reviewed before being deployed to production.

### Credential Compromise

**Q**: What if an integration's credentials are compromised?

**A**: Immediately revoke the compromised credentials in the respective service (GitHub, AWS, etc.) and generate new ones. Update the secrets in your Tooljump configuration. Consider implementing credential rotation policies and monitoring for unusual access patterns. Also, to ensure a limited blast radius, make sure all the credentials stored on your server only have read only permissions and are limited to the resources that you need to read. In this way, even if the credentials are compromised, the attacker's ability to perform changes across your tools is zero.

### Network Interception

**Q**: What if network traffic between the extension and server is intercepted?

**A**: Always use HTTPS in production to encrypt all communication. The extension transmits only contextual data, not credentials or sensitive information. Credentials are stored locally and never transmitted over the network.

### Integration Dependency Vulnerabilities

**Q**: What if a dependency used by an integration has a security vulnerability?

**A**: Enable GitHub's Dependabot alerts and regularly update dependencies. Tooljump's VM isolation limits the impact, but you should patch vulnerabilities promptly. Consider using tools like `npm audit` or `yarn audit` to identify vulnerable packages on your side as a best practice, just like you'd do for any other code running in your organization.

### Insider Threat Scenarios

**Q**: How do we protect against malicious actions by team members with access?

**A**: Implement proper access controls, audit logging, and code review processes. Store integrations in version control with required approvals. Consider implementing least-privilege access and regular access reviews.
