module.exports = {
    metadata: {
        name: 'hashicorp',
        description: 'Adds ToolJump to the Hashicorp website',
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
        return [{
            type: 'text',
            content: 'Hello from hashicorp integration'
        }];
    }
};
