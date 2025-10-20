---
id: generic-context
title: Generic context
keywords: [generic context, universal context, any website context, tooljump generic, context matching]
description: Learn how to use ToolJump's generic context to create integrations that work on any website or tool, not just specific platforms like GitHub or AWS.
---

# Generic context

For now, the ToolJump Chrome Extensions knows how to read in-depth information from Github and AWS.

However, there are many tools out there where running ToolJump is valuable, and you can leverege that by using the **generic context**.

The generic context **only sends the URL from the browser**. Nothing more. And it is up to you to process it in the integration and decide on which page/section of the website you are and what results to return for that.

## Using the generic context

### Step 1: Server configuration

Before you implement your first integration with generic context, you need to do a few changes to your configuration.

For the purpose of our tutorial, let's assume you want to run ToolJump on `https://developer.hashicorp.com`

In your main file, update:
```javascript
const config = DEFAULT_CONFIG;
```
to
```javascript
const config = DEFAULT_CONFIG;
config.adapters.generic.urls = ['https://developer.hashicorp.com'];
```

This ensures the ToolJump server is accepting integrations using this website. **You need to restart your server after this change!**

### Step 2: Writing the integration

Then, create your integration. The key part is defining the `contextType: generic` and the `url`:

```javascript
module.exports = {
    metadata: {
        name: 'custom',
        description: 'Adds Datadog to AWS Lambda functions',
        match: {
            contextType: 'generic',
            context: {
                url: { startsWith: 'https://developer.hashicorp.com' }
            }
        },
        cache: 300,
        requiredSecrets: []
    },
    async run(context, secrets = {}, dataFiles = []) {
        // you can process the url by using context.url
        return [{
            type: 'text',
            content: 'Hello from custom integration'
        }];
    }
};
```
Using `startsWith` will ensure the integration will run on the homepage and any subpage of the website. If you want an exact match, use `equals` instead.

### Step 3: Giving the permission

Then, go to ToolJump's Settings -> Providers section where you will see the website listed there, as shown in the image below:

<img src="/img/generic-context-settings.png" alt="ToolJump Providers Settings showing generic context website" width="280px" />

Click on the toggle next to the website to enable. You will get the following pop-up from Chrome asking you to allow the action. Press allow to allow.

<img src="/img/generic-context-allow.png" alt="ToolJump Providers Settings showing generic context website" width="480px" />.

After that, refresh your current page and the ToolJump bar will appear.