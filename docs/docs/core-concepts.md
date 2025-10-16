---
id: core-concepts
title: Core Concepts - How ToolJump Connects Developer Tools
sidebar_label: Core concepts
keywords: [tooljump concepts, core concepts, developer tool integration, knowledge as a service, context matching]
description: Learn ToolJump's core concepts including integrations, contexts, data types, and how the platform connects developer tools to improve engineering workflows.
---

# Core Concepts - How ToolJump Connects Developer Tools

To make the best use of ToolJump, you need to have a basic understanding of its core concepts:

## 1. Contexts

A context is a JSON object containing the most important information of the currently visited website.

It is produced by the ToolJump Chrome Extension and is sent to the ToolJump server in order to produce links and insights about the page visited.

For example, when you're visiting a Lambda function called my-test-lambda-function in AWS Console, your context will look like:

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

Read more about how contexts are created, and their structure [here](./chrome-extension-architecture.md)

## 2. Integrations

Integrations are JavaScript files written by you, responsible for providing one or more links or insights for a given context received.

For example, for the context above related to the Lambda function, the integration could obtain the function name, figure out its GitHub repository, and return a link to it. Or, it could connect to PagerDuty and find out who is currently on call.

Read more about how integrations work and how to create your own integrations [here](./writing-integrations/hello-world.mdx)

## What's the relationship between the Contexts and Integrations?

1. The contexts are produced by the Chrome Extensions, based on the page the user is currently visiting. The result is a JSON object.
1. The context is sent to the ToolJump server, which analyses it and finds one or more integrations that match this context, runs them, and then returns the results to the Chrome Extension, which displays the insights and links.
