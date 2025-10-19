---
id: privacy
title: Privacy Policy
sidebar_label: Privacy Policy
keywords: [privacy policy, data protection, tooljump privacy, user data, chrome extension privacy]
description: ToolJump's privacy policy explaining how we handle your data, what information we collect, and your rights regarding privacy when using our developer tool integration platform.
---

# Privacy Policy

**Last Updated: October 20, 2025**

This Privacy Policy describes how ToolJump ("we", "our", or "the extension") handles your information when you use the ToolJump Chrome Extension.

## Overview

ToolJump is committed to protecting your privacy. This policy explains what data we collect, how we use it, and your rights regarding your information.

## Information We Collect

### Data Stored Locally

The ToolJump extension stores the following information **locally on your device** using Chrome's local storage API:

- **Server Host URL**: The URL of your ToolJump server (if you're self-hosting)
- **Authentication Token**: A secure token to authenticate with your ToolJump server
- **Display Preferences**: Your chosen display mode (integrated or floating)
- **Debug Settings**: Your debugging and demo mode preferences

**Important**: All of this data is stored locally in your browser. We do not transmit, collect, or store any of this information on our servers.

### Data We Do NOT Collect

ToolJump does **NOT** collect, transmit, or store:

- Personal information (name, email, etc.)
- Browsing history
- Page content from websites you visit
- GitHub code or repository data
- AWS account information or credentials
- Any analytics or usage data

## How We Use Information

### Local Data Usage

The locally stored data is used exclusively to:

1. Connect to your self-hosted ToolJump server
2. Authenticate API requests to your server
3. Display extension UI according to your preferences
4. Enable debugging features when requested

### Server Communication

When you configure the extension to connect to a ToolJump server:

- The extension sends **context information** (current URL, page type) to your configured server
- Your server responds with relevant tool integrations and data
- All communication is between your browser and your configured server
- We (ToolJump) do not intercept, monitor, or store these communications

## Permissions Explanation

The extension requests the following Chrome permissions:

### Required Permissions

- **`scripting`**: Used to inject the ToolJump UI into web pages (GitHub, AWS Console, etc.)
- **`activeTab`**: Used to read the current page URL and context (e.g., repository name on GitHub)
- **`storage`**: Used to save your preferences and server configuration locally in your browser

### Host Permissions

- **`https://github.com/*`**: Access GitHub pages to provide context-aware integrations
- **`https://*.aws.amazon.com/*`**: Access AWS Console to provide context-aware integrations
- **Optional: `https://*/*`**: Allows you to enable ToolJump on custom domains (requires your explicit permission per domain)

These permissions are **only used** to:
1. Detect what page you're on (e.g., which GitHub repository)
2. Display relevant tool information for that context
3. Inject the ToolJump UI into the page

We do **NOT** use these permissions to collect, transmit, or store your browsing data.

## Data Security

- All data is stored locally using Chrome's secure storage API
- Authentication tokens are stored securely and only sent to your configured server
- No data is transmitted to ToolJump servers (we don't operate any data collection servers)
- All communication with your ToolJump server uses HTTPS when properly configured

## Third-Party Services

ToolJump itself does not use any third-party services. However:

- If you configure a ToolJump server, that server may connect to third-party APIs (GitHub, AWS, etc.) based on your integrations
- Those connections are made by **your server**, not by the extension
- Please review the privacy policies of any third-party services your integrations connect to

## Your Rights

You have complete control over your data:

- **Access**: All your data is stored locally and accessible through Chrome's developer tools
- **Deletion**: Uninstalling the extension removes all locally stored data
- **Modification**: You can change or delete your settings at any time through the extension popup
- **Portability**: Your data is stored in standard Chrome storage format

## Children's Privacy

ToolJump is not directed at children under 13. We do not knowingly collect information from children.

## Changes to This Policy

We may update this Privacy Policy from time to time. We will notify users of any material changes by:

- Updating the "Last Updated" date at the top of this policy
- Posting a notice in the extension or on our website

## Open Source

ToolJump is open source. You can review our code to verify our privacy practices:

- Extension Code: [https://github.com/tooljump/tooljump/tree/main/extension](https://github.com/tooljump/tooljump/tree/main/extension)
- Full Repository: [https://github.com/tooljump/tooljump](https://github.com/tooljump/tooljump)

## Contact Us

If you have questions about this Privacy Policy or our privacy practices:

- **Email**: Create an issue on GitHub
- **GitHub Issues**: [https://github.com/tooljump/tooljump/issues](https://github.com/tooljump/tooljump/issues)

## Summary

**TL;DR:**
- ✅ We store your settings locally on your device
- ✅ You control where the extension connects (your own server)
- ❌ We don't collect, transmit, or store your personal data
- ❌ We don't track your browsing or usage
- ❌ We don't share data with anyone (there's no data to share)
- 🔓 Our code is open source and auditable

Your privacy is important to us. ToolJump is designed to enhance your workflow without compromising your data security.

