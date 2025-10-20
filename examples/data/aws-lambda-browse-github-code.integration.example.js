module.exports = {
    metadata: {
        name: 'aws-lambda-browse-github-code',
        description: 'Browse the deployed code for AWS Lambda functions by linking to the GitHub repository at the specific version',
        match: {
            contextType: 'aws',
            context: {
                'service.name': { equals: 'lambda' },
                'service.arn': { exists: true },
                'scope.region': { exists: true },
                'service.resourceName': { exists: true }
            }
        },
        requiredSecrets: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'],
        cache: 900
    },
    run: async function (context, secrets = {}) {
        // Get AWS region from context
        const awsRegion = context.scope.region;
        const functionName = context.service.resourceName;

        try {
            // Query AWS Lambda to get function tags
            const { LambdaClient, ListTagsCommand } = require('@aws-sdk/client-lambda');
            
            const lambdaClient = new LambdaClient({
                credentials: {
                    accessKeyId: secrets.AWS_ACCESS_KEY_ID,
                    secretAccessKey: secrets.AWS_SECRET_ACCESS_KEY,
                },
                region: awsRegion
            });

            const command = new ListTagsCommand({ Resource: context.service.arn });
            const tagsResponse = await lambdaClient.send(command);
            
            // Look for repository and version tags
            const repository = tagsResponse.Tags?.repository;
            const version = tagsResponse.Tags?.version;
            
            if (!repository) {
                logger.warn({
                    operation: 'aws-lambda-browse-github-code',
                    step: 'no-repository-tag',
                    functionName: functionName
                }, 'No repository tag found on Lambda function');
                return [];
            }

            if (!version) {
                logger.warn({
                    operation: 'aws-lambda-browse-github-code',
                    step: 'no-version-tag',
                    functionName: functionName,
                    repository: repository
                }, 'No version tag found on Lambda function');
                return [];
            }

            // Construct GitHub URL
            const githubUrl = `https://github.com/${repository}/tree/${version}`;

            const results = [
                {
                    type: 'link',
                    content: `Browse code @ ${version.substring(0, 7)}`,
                    href: githubUrl,
                    icon: 'github'
                }
            ];

            logger.info({
                operation: 'aws-lambda-browse-github-code',
                step: 'success',
                functionName: functionName,
                repository: repository,
                version: version,
                githubUrl: githubUrl
            }, 'Successfully generated GitHub code browse link');

            return results;

        } catch (error) {
            logger.error({
                operation: 'aws-lambda-browse-github-code',
                step: 'aws-lambda-error',
                functionName: functionName,
                error: error.message
            }, 'Error querying AWS Lambda tags');
            return [];
        }
    }
};
