module.exports = {
    metadata: {
        name: 'aws-lambda',
        description: 'Adds Datadog to AWS Lambda functions',
        match: {
            contextType: 'aws',
            context: {
                'service.name': { equals: 'lambda' },
                'service.arn': { exists: true }
            }
        },
        cache: 300,
        requiredSecrets: [
            'AWS_ACCESS_KEY_ID',
            'AWS_SECRET_ACCESS_KEY'
        ]
    },
    
    async run(context, secrets = {}, dataFiles = []) {
        // Import AWS SDK only when needed to avoid metadata extraction issues
        const { LambdaClient, GetFunctionConfigurationCommand, ListTagsCommand } = require("@aws-sdk/client-lambda");
        
        logger.info({
            operation: 'aws-lambda-integration',
            step: 'initialization',
            contextService: context.service.name,
            hasArn: !!context.service.arn
        }, 'AWS Lambda integration starting');
        
        if (context.service.name === 'lambda' && context.service.arn) {
            try {
                const lambda = new LambdaClient({
                    region: context.scope.region, 
                    credentials: { 
                        accessKeyId: secrets.AWS_ACCESS_KEY_ID, 
                        secretAccessKey: secrets.AWS_SECRET_ACCESS_KEY 
                    },
                });

                logger.debug({
                    operation: 'aws-lambda-integration',
                    step: 'aws-api-call',
                    functionArn: context.service.arn,
                    region: context.scope.region
                }, 'Fetching Lambda function configuration and tags');

                const [envVars, tags] = await Promise.all([
                    lambda.send(new GetFunctionConfigurationCommand({ FunctionName: context.service.arn })),
                    lambda.send(new ListTagsCommand({ Resource: context.service.arn }))
                ]);

                const results = [
                    { type: 'text', content: 'Env: ' + tags.Tags.stage, status: 'important', tooltip: 'Current deployment environment' },
                    { 
                        type: 'link', 
                        content: 'Logs', 
                        icon: 'datadog', 
                        href: 'https://app.datadoghq.com/logs?query=' + encodeURIComponent(`function_arn:${context.service.arn}`),
                        tooltip: 'View function logs in Datadog'
                    },
                    { 
                        type: 'link', 
                        content: '3 alerts active', 
                        icon: 'datadog', 
                        href: 'https://app.datadoghq.com/logs?query=' + encodeURIComponent(`function_arn:${context.service.arn}`), 
                        status: 'important',
                        tooltip: 'Critical alerts requiring attention'
                    },
                    { 
                        type: 'link', 
                        content: 'Code @ ' + envVars.Environment.Variables['COMMIT_HASH'], 
                        icon: 'github', 
                        href: tags.Tags.repository + '/tree/' + envVars.Environment.Variables['COMMIT_HASH'],
                        tooltip: 'View source code for this deployment'
                    },
                    { 
                        type: 'link', 
                        content: 'CI/CD pipeline', 
                        icon: 'circleci', 
                        href: tags.Tags.repository + '/tree/' + envVars.Environment.Variables['COMMIT_HASH'],
                        tooltip: 'View build and deployment pipeline'
                    },
                    { 
                        type: 'link', 
                        content: 'Oncall: John', 
                        href: tags.Tags.repository + '/tree/' + envVars.Environment.Variables['COMMIT_HASH'],
                        tooltip: 'Current on-call engineer'
                    },
                    { type: 'link', content: '#my-service-channel', href: 'https://www.npmjs.com/package/lunr-languages', icon: 'slack', tooltip: 'Team Slack channel' },
                ];

                logger.info({
                    operation: 'aws-lambda-integration',
                    step: 'completion',
                    resultsCount: results.length,
                    functionName: envVars.FunctionName
                }, 'AWS Lambda integration completed successfully');

                return results;
            } catch (error) {
                logger.error({
                    operation: 'aws-lambda-integration',
                    step: 'error-handling',
                    functionArn: context.service.arn,
                    errorType: error.name || 'UnknownError'
                }, 'AWS Lambda integration failed', error);

                return [{
                    type: 'error',
                    content: `AWS Lambda integration error: ${error.message}`
                }];
            }
        }

        logger.debug({
            operation: 'aws-lambda-integration',
            step: 'no-match',
            contextService: context.service.name,
            hasArn: !!context.service.arn
        }, 'Context does not match Lambda service requirements');

        return [];
    }
};
