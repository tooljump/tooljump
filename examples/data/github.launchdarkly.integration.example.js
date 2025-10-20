module.exports = {
    metadata: {
        name: 'github-launchdarkly',
        description: 'Show LaunchDarkly feature flags tagged with this repository as a dropdown',
        match: {
            contextType: 'github',
            context: {
                'page.repository': { startsWith: 'my-org/' }
            }
        },
        requiredSecrets: ['LAUNCHDARKLY_ACCESS_TOKEN'],
        cache: 1800
    },
    run: async function (context, secrets = {}) {
        // Extract repository name (last part after /)
        const repository = context.page.repository; // e.g., "company/webshop"
        const repoName = repository.split('/').pop(); // e.g., "webshop"
        
        const projectKey = 'your-project-key'; // Replace with your LaunchDarkly project key
        const tagKey = 'repository';
        const tagValue = repoName;

        const apiUrl = `https://app.launchdarkly.com/api/v2/flags/${projectKey}?filter=tags:${tagKey}:${tagValue}`;

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${secrets.LAUNCHDARKLY_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`LaunchDarkly API request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const flags = data.items || [];

        if (flags.length === 0) {
            return [];
        }

        // First 10 items
        const items = flags.slice(0, 10).map(flag => ({
            content: flag.key,
            href: `https://app.launchdarkly.com/${projectKey}/flags/${flag.key}`,
            icon: 'launchdarkly'
        }));

        // If more than 10, add a More… item linking to LaunchDarkly flags list filtered by tag
        if (flags.length > 10) {
            const moreUrl = `https://app.launchdarkly.com/${projectKey}/flags?filter=tags:${tagKey}:${tagValue}`;
            items.push({ 
                content: 'More…', 
                href: moreUrl, 
                status: 'relevant',
                icon: 'launchdarkly'
            });
        }

        return [{
            type: 'dropdown',
            content: `Feature Flags (${flags.length} flags)`,
            icon: 'launchdarkly',
            items
        }];
    }
};
