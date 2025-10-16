---
id: architecture
title: High level architecture
sidebar_label: High level architecture
keywords: [tooljump architecture, chrome extension, server architecture, integrations, developer tool platform]
description: Learn how ToolJump's architecture works with Chrome extension, server, and integrations to connect developer tools and deliver contextual information where engineers work.
---

# ToolJump Architecture

ToolJump is comprised of 3 main components:
1. ToolJump Chrome Extension
1. ToolJump Server
1. ToolJump Integrations



![ToolJump architecture](/img/tooljump-architecture.png)


|                     | ToolJump Chrome Extension                    | ToolJump Server                    | ToolJump Integrations                    |
|--------------------------|---------------------------------------------|-----------------------------------|------------------------------------------|
| **What it does do?**   | Understands the pages you visit, sends the summary to the ToolJump server, and gets back useful insights and links to other tools | Based on the data received from extensions, runs the user-defined integrations and returns the results to the users  | Provides the logic for connecting tools between them |
| **Where is it Deployed?**   | In user's browser (client-side)               | Cloud / on‑prem server belonging to you/your company            | In a GitHub repo belonging to you/your company|
| **How to install/deploy it?**       | [Download the Chrome extension](./getting-started) to your browser and point it to your ToolJump server (5 mins)                | You or your DevOps team [can set it up](./deployment) in your company (1-5 days)           | Your senior engineers can [write the integrations](./writing-integrations) based on the knowhow of available tools in your company (1-5 days)                  |

:::info
ToolJump is self-hosted. You can host it yourself, and you are responsible for its deployments, security, monitoring and storing the secrets for the tools that ToolJump communicates with. We do not store anything on our side.
:::

## End to end functionality

Here's the end to end flow, from a page visit all the way to getting the insights in the ToolJump context bar:

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant TJCE as ToolJump Chrome Extension
    participant TJS as ToolJump Server
    participant TJIN as Integrations
    participant EXT as External Tools (eg: Datadog, AWS, CircleCI, etc)

    U->>U: Enters a website (e.g., GitHub)
    U->>TJCE: Has the chrome extension enabled
    TJCE->>TJCE: Captures the most important information<br /> on the website as a JSON
    TJCE->>TJS: Sends the captured information
    loop For each defined integration
        TJS->>TJIN: Read integration
        TJS->>TJS: Decide if it should<br /> be ran (based on context)
        TJS->>TJS: If yes, run the integration's code
        TJS->>EXT: Integration can reach out to external tools for obtaining data
        EXT->>TJS: Return data from external tools
        TJS->>TJS: Build the results
    end
    TJS->>TJCE: Return results to the extension
    TJCE->>U: Show the information to the user in the context bar



```
