module.exports = {
    metadata: {
        name: 'github-aws-costs',
        description: 'Show last 30 days AWS cost for resources tagged with this GitHub repository and link to Cost Explorer',
        match: {
            contextType: 'github',
            context: {
                'page.repository': { startsWith: 'my-org/' }
            }
        },
        requiredSecrets: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'],
        cache: 300
    },
    run: async function (context, secrets = {}) {
        // Import AWS SDK v3 Cost Explorer client only at runtime
        const { CostExplorerClient, GetCostAndUsageCommand } = require('@aws-sdk/client-cost-explorer');

        // Tag key and value derived from GitHub context
        const tagKey = 'repository';
        const tagValue = context.page.repository; // e.g. "company/webshop"

        // Cost Explorer is in us-east-1
        const client = new CostExplorerClient({
            region: 'us-east-1',
            credentials: {
                accessKeyId: secrets.AWS_ACCESS_KEY_ID,
                secretAccessKey: secrets.AWS_SECRET_ACCESS_KEY,
            },
        });

        // Build a 30-day window (End is exclusive per AWS API)
        function toYMD(d) {
            const y = d.getUTCFullYear();
            const m = String(d.getUTCMonth() + 1).padStart(2, '0');
            const day = String(d.getUTCDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        }
        const endDate = new Date(); // today (exclusive)
        const startDate = new Date();
        startDate.setUTCDate(endDate.getUTCDate() - 30);

        const params = {
            TimePeriod: { Start: toYMD(startDate), End: toYMD(endDate) },
            Granularity: 'DAILY',
            Metrics: ['UnblendedCost'],
            Filter: {
                Tags: { Key: tagKey, Values: [tagValue] }
            }
        };

        let total = 0;
        let unit = 'USD';
        let nextToken;
        do {
            const resp = await client.send(new GetCostAndUsageCommand({ ...params, NextPageToken: nextToken }));
            if (Array.isArray(resp.ResultsByTime)) {
                for (const p of resp.ResultsByTime) {
                    const metric = p.Total && p.Total.UnblendedCost;
                    if (metric && metric.Amount) {
                        total += parseFloat(metric.Amount);
                        unit = metric.Unit || unit;
                    }
                }
            }
            nextToken = resp.NextPageToken;
        } while (nextToken);

        // Build a deep link to AWS Cost Explorer filtered by the tag and last 30 days
        const ceFilter = { Tags: { Key: tagKey, Values: [tagValue] } };
        const ceUrl = 'https://us-east-1.console.aws.amazon.com/cost-management/home' +
            '?region=us-east-1#/cost-explorer' +
            `?timeRange=LAST_30_DAYS&granularity=DAILY&costMetric=UnblendedCost&filter=${encodeURIComponent(JSON.stringify(ceFilter))}`;

        // Format amount (simple two-decimal string)
        const currencySymbol = unit === 'USD' ? '$' : `${unit} `;
        const pretty = `${currencySymbol}${total.toFixed(2)}`;

        const results = [
            { type: 'link', content: `Costs 30d: ${pretty}`, href: ceUrl }
        ];

        return results;
    }
};

