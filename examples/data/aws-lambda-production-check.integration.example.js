module.exports = {
    metadata: {
        name: 'aws-lambda-production-check',
        description: 'Shows production environment status for AWS Lambda functions',
        match: {
            contextType: 'aws',
            context: {
                'service.name': { equals: 'lambda' },
                'global.accountId': { exists: true }
            }
        },
        cache: 3600
    },
    
    async run(context, secrets = {}, dataFiles = []) {
        logger.info({
            operation: 'aws-lambda-production-check',
            step: 'initialization',
            contextService: context.service.name,
            accountId: context.global.accountId
        }, 'AWS Lambda production check starting');
        
        // Production account ID - replace with your actual production account ID
        const PRODUCTION_ACCOUNT_ID = '12345678';
        
        if (context.global.accountId === PRODUCTION_ACCOUNT_ID) {
            logger.info({
                operation: 'aws-lambda-production-check',
                step: 'production-detected',
                accountId: context.global.accountId,
                functionName: context.service.resourceName
            }, 'Production environment detected');
            
            return [{
                type: 'text',
                content: 'In production env!',
                status: 'important'
            }];
        }

        logger.debug({
            operation: 'aws-lambda-production-check',
            step: 'no-production',
            contextService: context.service.name,
            accountId: context.global.accountId
        }, 'Not in production environment');

        return [];
    }
};
