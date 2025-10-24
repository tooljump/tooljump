module.exports = {
    metadata: {
        name: 'aws-lambda-pagerduty-oncall',
        description: 'Show current L1 on-call for the PagerDuty service associated with this Lambda function',
        match: {
            contextType: 'aws',
            context: {
                'service.name': { equals: 'lambda' },
                'service.arn': { exists: true },
                'scope.region': { exists: true },
                'service.resourceName': { exists: true }
            }
        },
        requiredSecrets: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'PAGERDUTY_API_TOKEN'],
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
            
            // Look for service tag
            const serviceName = tagsResponse.Tags?.service;
            
            if (!serviceName) {
                logger.warn({
                    operation: 'aws-lambda-pagerduty-oncall',
                    step: 'no-service-tag',
                    functionName: functionName
                }, 'No service tag found on Lambda function');
                return [];
            }

            // Query PagerDuty for the service
            const PD_HOST = 'https://api.pagerduty.com'; // US API
            const headers = {
                'Authorization': `Token token=${secrets.PAGERDUTY_API_TOKEN}`,
                'Accept': 'application/vnd.pagerduty+json;version=2',
                'Content-Type': 'application/json'
            };

            // Search for services by name
            const servicesResp = await fetch(`${PD_HOST}/services?query=${encodeURIComponent(serviceName)}&limit=25`, { headers });
            if (!servicesResp.ok) {
                throw new Error(`PagerDuty API error (services): ${servicesResp.status} ${servicesResp.statusText}`);
            }
            const servicesJson = await servicesResp.json();
            const service = (servicesJson.services || []).find(s => s.name === serviceName);
            
            if (!service) {
                logger.warn({
                    operation: 'aws-lambda-pagerduty-oncall',
                    step: 'service-not-found',
                    functionName: functionName,
                    serviceName: serviceName
                }, 'PagerDuty service not found');
                return [];
            }

            // Fetch service to get escalation policy
            const serviceResp = await fetch(`${PD_HOST}/services/${encodeURIComponent(service.id)}?include[]=escalation_policy`, { headers });
            if (!serviceResp.ok) {
                throw new Error(`PagerDuty API error (service): ${serviceResp.status} ${serviceResp.statusText}`);
            }
            const serviceJson = await serviceResp.json();
            const ep = serviceJson.service && serviceJson.service.escalation_policy;
            if (!ep || !ep.id) {
                logger.warn({
                    operation: 'aws-lambda-pagerduty-oncall',
                    step: 'no-escalation-policy',
                    functionName: functionName,
                    serviceName: serviceName,
                    serviceId: service.id
                }, 'No escalation policy found for service');
                return [];
            }

            // Query on-calls for this escalation policy and pick L1
            const oncallsResp = await fetch(`${PD_HOST}/oncalls?limit=25&escalation_policy_ids[]=${encodeURIComponent(ep.id)}`, { headers });
            if (!oncallsResp.ok) {
                throw new Error(`PagerDuty API error (oncalls): ${oncallsResp.status} ${oncallsResp.statusText}`);
            }
            const oncallsJson = await oncallsResp.json();
            const l1 = (oncallsJson.oncalls || []).find(o => o.escalation_level === 1);
            if (!l1 || !l1.user) {
                logger.warn({
                    operation: 'aws-lambda-pagerduty-oncall',
                    step: 'no-oncall-user',
                    functionName: functionName,
                    serviceName: serviceName,
                    serviceId: service.id
                }, 'No L1 on-call user found');
                return [];
            }

            // Extract first name
            const fullName = l1.user.name || l1.user.summary || '';
            const firstName = fullName.split(' ')[0] || fullName;

            // Build deep link to On-Call view filtered by service
            const oncallUrl = `https://app.pagerduty.com/oncalls?service_ids[]=${encodeURIComponent(service.id)}`;

            const results = [
                {
                    type: 'link',
                    content: `On-call: ${firstName}`,
                    href: oncallUrl,
                    icon: 'pagerduty'
                }
            ];

            return results;

        } catch (error) {
            logger.error({
                operation: 'aws-lambda-pagerduty-oncall',
                step: 'error',
                functionName: functionName,
                error: error.message
            }, 'Error retrieving on-call information');
            return [];
        }
    }
};
