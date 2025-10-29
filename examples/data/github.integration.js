module.exports = {
    metadata: {
        name: 'example-github-insights',
        description: 'Shows sample insights for a GitHub repository',
        match: {
            contextType: 'github',
            context: {
                'page.repository': { equals: 'tooljump/tooljump' }
            }
        },
        cache: 300
    },
    run: async function (context, secrets = {}, dataFiles = []) {
        const results = [
            { type: 'link', content: '3 alerts active', href: 'https://tooljump.dev/docs/writing-integrations/hello-world?from_extension=1', status: 'important', icon: 'datadog', tooltip: 'Critical alerts requiring immediate attention' },
            { type: 'link', content: 'Logs', href: 'https://tooljump.dev/docs/writing-integrations/hello-world?from_extension=1', icon: 'datadog', tooltip: 'View recent application logs and errors' },
            { type: 'dropdown', content: 'AWS Infra (2 lambdas)', icon: 'lambda', items: [{ type: 'link', content: 'my-app-server', href: 'https://tooljump.dev/docs/writing-integrations/hello-world?from_extension=1', icon: 'lambda', }, { type: 'link', content: 'my-app-dispatcher', href: 'https://tooljump.dev/docs/writing-integrations/hello-world?from_extension=1', icon: 'lambda',}]},
            { type: 'link', content: 'Cost 30d: $351', href: 'https://tooljump.dev/docs/writing-integrations/hello-world?from_extension=1', tooltip: 'AWS costs for the last 30 days' },
            { type: 'link', content: 'Oncall: John', href: 'https://tooljump.dev/docs/writing-integrations/hello-world?from_extension=1', icon: 'pagerduty', tooltip: 'Current on-call engineer for this service' },
            { type: 'link', content: '#my-service-channel', href: 'https://tooljump.dev/docs/writing-integrations/hello-world?from_extension=1', icon: 'slack', tooltip: 'Team Slack channel for discussions' },
            { type: 'link', content: 'Last deployed 3d ago', href: 'https://tooljump.dev/docs/writing-integrations/hello-world?from_extension=1', icon: 'circleci', tooltip: 'Most recent deployment was 3 days ago' },
            { 
                type: 'dropdown',
                content: 'Deployment URLs',
                tooltip: 'Access different deployment environments',
                items: [
                    { content: 'Dev: http://dev.my.service', href: 'https://tooljump.dev/docs/writing-integrations/hello-world?from_extension=1', tooltip: 'Development environment for testing' },
                    { content: 'QA: http://qa.my.service', href: 'https://tooljump.dev/docs/writing-integrations/hello-world?from_extension=1', tooltip: 'Quality assurance environment' },
                    { content: 'Prod: http://prod.my.service', href: 'https://tooljump.dev/docs/writing-integrations/hello-world?from_extension=1', status: 'important', tooltip: 'Production environment - use with caution' }
                ]
            },
            { 
                type: 'dropdown',
                content: 'More',
                tooltip: 'Additional resources and documentation',
                items: [
                    { content: 'Docs', href: 'https://tooljump.dev/docs/writing-integrations/hello-world?from_extension=1', icon: 'confluence', tooltip: 'Service documentation and guides' },
                    { content: 'Postman collections', href: 'https://tooljump.dev/docs/writing-integrations/hello-world?from_extension=1', icon: 'postman', tooltip: 'API testing collections' }
                ]
            }
        ];

        return results;
    }
};
