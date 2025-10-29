---
id: connecting-your-tools-resources
title: Connecting Tools - Complete Guide to Developer Tool Integration
sidebar_label: Connecting your tools
keywords: [connecting tools, tool integration, developer tool connectivity, service integration, connect engineering tools, knowledge as a service]
description: Master connecting tools with our complete guide to developer tool integration. Learn proven strategies for connecting GitHub, AWS, Datadog, and more to eliminate context switching and boost developer experience.
canonical: https://tooljump.dev/docs/connecting-your-tools-resources
---

import StructuredData from '@site/src/components/StructuredData';

<StructuredData 
  type="BreadcrumbList" 
  data={{
    breadcrumbs: [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://tooljump.dev/"
      },
      {
        "@type": "ListItem", 
        "position": 2,
        "name": "Documentation",
        "item": "https://tooljump.dev/docs/"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "Connecting Tools",
        "item": "https://tooljump.dev/docs/connecting-your-tools-resources"
      }
    ]
  }} 
/>

# Connecting Tools - Complete Guide to Developer Tool Integration

Modern engineering teams rely on dozens of disconnected tools - from source control and observability platforms to CI/CD pipelines and monitoring systems. While each tool serves a critical purpose in your software delivery process, the lack of connectivity between them creates significant [developer experience](/docs/developer-experience) challenges that impact productivity and team efficiency.

[**ToolJump**](/docs/why) is a [Knowledge as a Service](/docs/knowledge-as-a-service) platform that helps you quickly navigate between these tools by automatically detecting context and providing one-click access to related resources across your entire toolchain. Instead of manually searching for the same service or repository across different platforms, ToolJump connects the dots for you, dramatically improving your [developer experience](/docs/developer-experience) through intelligent [connecting tools](/docs/connecting-your-tools-resources) strategies.

## Why Connecting Tools Matters for Developer Experience

The modern engineering workflow involves constant context switching between disconnected tools, which significantly impacts [developer experience](/docs/developer-experience). When tools aren't properly connected, teams face:

- **Knowledge silos** that slow down decision-making
- **Context switching overhead** that reduces productivity  
- **Tribal knowledge** that creates bottlenecks and dependencies
- **Inconsistent information** across different platforms

By implementing a systematic approach to [connecting tools](/docs/connecting-your-tools-resources), engineering teams can transform their workflow into a seamless, [Knowledge as a Service](/docs/knowledge-as-a-service) experience that eliminates these productivity killers.

To operate these tools at lightning speed and make your organisation truly efficient, you need to have consistent information across these tools. For example, a given service (say webshop) should be called the same across the source control tool, the CI/CD tool, the observability tool, the code scanning tool etc.

In order to bridge the gap between the tools correctly, you need to think of one primary key that every tool can agree on.

You have two ways of reasoning about this:

1. **Service-centric**: The key piece of information that identifies everything across your org is the service name.
   - **Example**: Your payment processing service might be called `payment-service` across all tools
   - **Best for**: Operations tools (monitoring, alerting, infrastructure) where you think in terms of business capabilities

2. **Repo-centric**: The key piece of information that identifies everything across your org is the repository name
   - **Example**: Your GitHub repository `my-org/payment-service` becomes the primary identifier
   - **Best for**: Development tools (CI/CD, code scanning, pull requests) where you think in terms of code locations

In reality, using a mix of both can cover pretty much every need you have, providing you have an easy way to translate from one to another and vice versa. For example, tools closer to source control (CI/CD, code/vulnerability scanning) benefit from the repo-centric approach, while tools closer to operations (observability, incident management) can benefit from the service-centric approach.

For detailed implementation guides, see our [integration recipes](/docs/recipes) for [AWS](/docs/recipes/connecting-to-aws), [GitHub](/docs/recipes/connecting-to-github), and [Datadog](/docs/recipes/connecting-to-datadog).

## How do you start?

Every major tool has the ability to add tags to its resources. If you will invest in properly tagging your resources across tools, it will pay dividends later. Your engineers ship faster, decreasing the time it takes to search things around, and focus on actually solving problems.

Let's go over a few examples, from simple to complex.

### Example 1: Discover the infrastructure for a given repository or service

Assuming you provision your infrastructure with IaC¹ (eg: Terraform, Pulumi, CloudFormation, etc) in a cloud environment, you can set a default set of tags that apply to all your resources created for a given project.

I suggest the following tags to all resources you provision via IaC (in Terraform that's called `default_tags`):
* `repository: my-org/webshop-admin`
* `service: webshop-admin`
* `env: prod` (set dynamically based on where the IaC is deploying)
* `team: devops-sre`

After this, you can easily look for resources based on one or more of these tags, and immediately understand the production footprint of your project.

Now the access is bidirectional. You can easily discover infrastructure based on repo or service name, and vice versa, you can discover the repo or service name by looking at an infrastructure resource.

### Example 2: Cross-tool incident response and debugging

When an incident occurs, you need to quickly trace the problem across multiple tools to understand what happened and how to fix it. With consistent tagging and naming, you can follow a service's journey through your entire toolchain.

Let's say you receive a PagerDuty² alert for `service:webshop-admin` showing high error rates. Here's how you can quickly investigate:

1. **Observability**: Query Datadog³ logs with `service:webshop-admin` to see the specific errors and their timestamps
2. **Source Control**: Use the `repository` tag to find the GitHub repository and check recent commits
3. **CI/CD**: Look up recent deployments in CircleCI or GitHub Actions for the webshop-admin service
4. **Infrastructure**: Check your Terraform Cloud or AWS console for any recent infrastructure changes tagged with `service:webshop-admin`
5. **Security**: Review recent security scans and vulnerability reports for the same service
6. **Documentation**: Quickly find runbooks and troubleshooting guides using the consistent service name

The key is that every tool uses the same `service:webshop-admin` identifier, so you can jump between tools without having to translate or guess what the service is called in each system. This saves precious minutes during incidents when every second counts.

See practical implementations in our [CircleCI deployment integration](/integrations/github-circleci-last-deploy) and [AWS costs integration](/integrations/github-aws-costs).

### Example 3: Tools that have limited (or no tagging support)

There can be situations in which a tool doesn't allow you to tag resources.

In this situation, you have two options:
1. Consistently name your resources across tools, so you are confident there is a 1:1 relationship between resources from one tool to another. Eg: if the service name is webshop, the resource in the other tool should be webshop as well.
2. Map the different resource names in another system

If you go with (2), you have a few options:
1. Use a Service Catalog (eg: Datadog Service Catalog) and query it via its API.
1. Store your own service database in yaml/json files and read from them

## In conclusion

In conclusion, if you follow the steps to set up your tools to use consistent names, to leverage tagging and to map resources from tools that don't support tagging, you will be already in a much better shape than 90% of the companies.

However, no matter the maturity level of your service organisation, [ToolJump](/docs/why) can help [connecting tools](/docs/connecting-your-tools-resources) so your engineers spend less time connecting the dots and more time shipping value.

Start building with our [writing integrations guide](/docs/writing-integrations) or explore the [integration examples gallery](/integrations).

---

## Glossary

¹ **IaC (Infrastructure as Code)**: A practice of managing and provisioning computing infrastructure through machine-readable definition files, rather than physical hardware configuration or interactive configuration tools.

² **PagerDuty**: An incident management platform that provides on-call scheduling, escalation policies, and incident response automation.

³ **Datadog**: A monitoring and analytics platform for cloud-scale applications, providing monitoring of servers, databases, tools, and services.