module.exports = {
    metadata: {
        name: 'github-show-deployed-service-urls',
        description: 'Show staging and production URLs for this repository as a dropdown, using a data file mapping',
        match: {
            contextType: 'github',
            context: {
                'page.repository': { startsWith: 'my-org/' }
            }
        },
        requiredSecrets: [],
        cache: 300
    },
    run: async function (context, secrets = {}, dataFiles = []) {
        const repo = context.page.repository; // e.g., "company/webshop"

        // Expect a data file like deployed-urls.data.json with shape:
        // { "mappings": { "org/repo": { "production": "https://...", "staging": "https://..." } } }
        const df = dataFiles.find(f => f.id === 'deployed-urls');
        if (!df || !df.data) {
            return [];
        }

        const mappings = df.data.mappings || {};
        const envs = mappings[repo];
        if (!envs || (typeof envs !== 'object')) {
            return [];
        }

        const items = [];
        if (envs.production) {
            items.push({ content: 'Production', href: envs.production, status: 'important', icon: 'link' });
        }
        if (envs.staging) {
            items.push({ content: 'Staging', href: envs.staging, icon: 'link' });
        }

        if (items.length === 0) {
            return [];
        }

        return [
            {
                type: 'dropdown',
                content: 'Deployed URLs',
                items
            }
        ];
    }
};

