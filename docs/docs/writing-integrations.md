---
id: writing-integrations
title: Writing Integrations
sidebar_label: Writing Integrations
keywords: [writing integrations, tooljump integrations, custom integrations, developer tool integration, javascript modules]
description: Learn how to write custom ToolJump integrations in JavaScript to connect your developer tools and create contextual information displays for your engineering team.
---

# Writing Integrations

ToolJump integrations are JavaScript modules that run in response to specific contexts and return structured data that can be displayed in the browser. This section covers everything you need to know to create your own integrations.

## What is an Integration?

An integration is a JavaScript file (`.integration.js`) that exports an object with:
- **Metadata**: Configuration that defines when and how the integration runs
- **Run function**: The actual logic that executes and returns results

## Quick Start

The fastest way to get started is to look at the [Hello World](./writing-integrations/hello-world.mdx) example, which shows a minimal integration, and then walks you through the next concepts and topics that help you build the integrations you need for your company.
