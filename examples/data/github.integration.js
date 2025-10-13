module.exports = {
    metadata: {
        name: 'example-github-insights',
        description: 'Shows sample insights for a GitHub repository',
        match: {
            contextType: 'github',
            context: {
                'page.repository': { equals: 'MihaiValentin/lunr-languages' } // TODO
            }
        },
        cache: 300
    },
    run: async function (context, secrets = {}, dataFiles = []) {
        const results = [
            { type: 'link', content: '3 alerts active', href: 'https://www.npmjs.com/package/lunr-languages', status: 'important', icon: 'datadog', tooltip: 'Critical alerts requiring immediate attention' },
            { type: 'link', content: 'Logs', href: 'https://www.npmjs.com/package/lunr-languages', icon: 'datadog', tooltip: 'View recent application logs and errors' },
            { type: 'link', content: 'Cost 30d: $351', href: 'https://www.npmjs.com/package/lunr-languages', tooltip: 'AWS costs for the last 30 days' },
            { type: 'link', content: 'Oncall: John', href: 'https://www.npmjs.com/package/lunr-languages', icon: 'pagerduty', tooltip: 'Current on-call engineer for this service' },
            { type: 'link', content: '#my-service-channel', href: 'https://www.npmjs.com/package/lunr-languages', icon: 'slack', tooltip: 'Team Slack channel for discussions' },
            { type: 'link', content: 'Last deployed 3d ago', href: 'https://www.npmjs.com/package/lunr-languages', icon: 'circleci', tooltip: 'Most recent deployment was 3 days ago' },
            { 
                type: 'dropdown',
                content: 'Deployment URLs',
                tooltip: 'Access different deployment environments',
                items: [
                    { content: 'Dev: http://dev.my.service', href: 'http://dev.my.service', tooltip: 'Development environment for testing' },
                    { content: 'QA: http://qa.my.service', href: 'http://qa.my.service', tooltip: 'Quality assurance environment' },
                    { content: 'Prod: http://prod.my.service', href: 'http://prod.my.service', status: 'important', tooltip: 'Production environment - use with caution' }
                ]
            },
            { 
                type: 'dropdown',
                content: 'More',
                tooltip: 'Additional resources and documentation',
                items: [
                    { content: 'Docs', href: 'http://dev.my.service', icon: 'confluence', tooltip: 'Service documentation and guides' },
                    { content: 'Postman collections', href: 'http://qa.my.service', icon: 'postman', tooltip: 'API testing collections' }
                ]
            }
        ];

        return results;
    }
};
