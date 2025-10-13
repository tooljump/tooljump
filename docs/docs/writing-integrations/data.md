---
id: data
title: Data
sidebar_label: Data
---

# Data

Integrations work with several kinds of data: the current **context**, data from **external APIs**, and local **data files**. Understanding how to access and combine these sources is essential for building powerful integrations.

As you link tools together, you will need to store the mapping information in a way or another.

If you already use a service catalog *(eg: Datadog Service Catalog)*, you can make use of it by querying it from your integration. One example can be: *"What is the team for this repository or service?"* or *"What are the SLOs for this service?"*

However, not every organization uses a service catalog, so Tooljump provides a simple way to ship data along with your integrations.

## Introducing Data Files

The `dataFiles` parameter provides access to local configuration and mapping files. JSON and YAML files are pre‑parsed into JavaScript objects.

### Working with Data Files

```javascript
run: async function (context, secrets = {}, dataFiles = []) {
    // Access data files by id
    const config = dataFiles.find(file => file.id === 'config');
    const users = dataFiles.find(file => file.id === 'users');
    
    // Contents are already parsed for .json/.yml
    logger.info(config.data);
    logger.info(users.data);
}
```

### Examples

#### Normalizing names across services

Let's assume a given service is present across multiple tools, but due to legacy reasons, it appears under different names.

Of course, the best course of action would be to rename it so it becomes consistent, but given the complexities of this effort, this could take months.

Create a `config.data.json` file storing mappings between systems, and use it from your integration to normalize references.

```javascript
// config.data.json
{
    "mappings": [
        {
            "systemA": "webshop",
            "systemB": "web-shop"
        },
        {
            "systemA": "notifier",
            "systemB": "notification-service"
        }
    ]
}
```

In an integration:
```javascript
run: async function (context, secrets = {}, dataFiles = []) {
    const config = dataFiles.find(file => file.id === 'config');
    
    console.log(config.data.mappings); // outputs the mappings array
}
```

#### Normalize GitHub usernames with corporate emails

If a company did not have a formal GitHub user creation policy (e.g., only allowing corporate email accounts), mapping GitHub usernames to corporate identities can be difficult.

We can solve this easily with a mapping:

```javascript
// users.data.json
{
  "mappings": {
    "j0hn": "john@company.com",
    "the_wizard": "mike@company.com"
  }
}
```
In a GitHub integration:
```javascript
run: async function (context, secrets = {}, dataFiles = []) {
    const users = dataFiles.find(file => file.id === 'users');
    const githubLoggedInUser = context.global.user;

    if (!githubLoggedInUser) {
      return [];
    }

    const companyEmail = users.data.mappings[githubLoggedInUser];
    
    // now you can use the company email to identify the user in another tool
}
```

## Next Steps

Now that you understand data handling, learn how to debug integrations when things don’t go as expected:
- **[Debugging](./debugging.md)** - Techniques and common issues
