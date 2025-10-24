module.exports = {
    metadata: {
        name: 'github-slack-channel',
        description: 'Show the Slack channel mapped to this repository via data files',
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

        // Expect a data file like slack-channels.data.json with shape:
        // { "mappings": { "company/webshop": "#webshop" } }
        const df = dataFiles.find(f => f.id === 'slack-channels');
        if (!df || !df.data || !df.data.mappings) {
            return [];
        }

        let channel = df.data.mappings[repo];
        if (!channel || typeof channel !== 'string') {
            return [];
        }

        // Normalize channel value (accepts "#name", "name", or channel ID)
        const normalized = channel.startsWith('#') ? channel.slice(1) : channel;

        // Slack app redirect supports channel by name or ID
        const slackUrl = `https://slack.com/app_redirect?channel=${encodeURIComponent(normalized)}`;

        return [
            { type: 'link', content: `#${normalized}`, icon: 'slack', href: slackUrl },
        ];
    }
};

