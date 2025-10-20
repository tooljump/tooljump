module.exports = {
    metadata: {
        name: 'github-aws-infrastructure',
        description: 'Show Lambda functions in us-east-1 tagged with this repository as a dropdown',
        match: {
            contextType: 'github',
            context: {
                'page.repository': { startsWith: 'my-org/' }
            }
        },
        requiredSecrets: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'],
        cache: 1800
    },
    run: async function (context, secrets = {}) {
        const { ResourceGroupsTaggingAPIClient, GetResourcesCommand } = require('@aws-sdk/client-resource-groups-tagging-api');

        const region = 'us-east-1';
        const tagKey = 'repository';
        const tagValue = context.page.repository; // e.g., "company/webshop"

        const tagging = new ResourceGroupsTaggingAPIClient({
            region,
            credentials: {
                accessKeyId: secrets.AWS_ACCESS_KEY_ID,
                secretAccessKey: secrets.AWS_SECRET_ACCESS_KEY,
            },
        });

        const matched = [];
        let token;
        do {
            const out = await tagging.send(new GetResourcesCommand({
                ResourceTypeFilters: ['lambda:function'],
                TagFilters: [{ Key: tagKey, Values: [tagValue] }],
                PaginationToken: token,
            }));

            const list = out.ResourceTagMappingList || [];
            for (const m of list) {
                if (matched.length > 10) break; // collect up to 11 to know if there are more
                const arn = m.ResourceARN || '';
                const name = arn.split(':').pop();
                if (name) {
                    matched.push({ name, arn });
                }
            }

            token = out.PaginationToken;
            if (matched.length > 10) break;
        } while (token);

        if (matched.length === 0) {
            return [];
        }

        // First 10 items
        const items = matched.slice(0, 10).map(m => ({
            content: m.name,
            href: `https://${region}.console.aws.amazon.com/lambda/home?region=${region}#/functions/${encodeURIComponent(m.name)}?tab=configuration`
        }));

        // If more than 10, add a More… item linking to Lambda list filtered by tag
        if (matched.length > 10) {
            const moreUrl = `https://${region}.console.aws.amazon.com/lambda/home?region=${region}#/functions?search=${encodeURIComponent('tag:repository=' + tagValue)}`;
            items.push({ content: 'More…', href: moreUrl, status: 'relevant' });
        }

        return [{
            type: 'dropdown',
            content: `AWS Infra (${matched.length} Lambdas)`,
            items
        }];
    }
};
