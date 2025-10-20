module.exports = {
    metadata: {
        name: 'aws-lambda-datadog-logs-alerts',
        description: 'Show any active alerts from Datadog for AWS Lambda functions, and jump from AWS Lambda to Logs and Alerts for this service',
        match: {
            contextType: 'aws',
            context: {
                'service.name': { equals: 'lambda' },
                'service.arn': { exists: true },
                'scope.region': { exists: true },
                'service.resourceName': { exists: true }
            }
        },
        requiredSecrets: ['DATADOG_API_KEY', 'DATADOG_APP_KEY', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'],
        cache: 300
    },
    run: async function (context, secrets = {}) {
        // adjust this to your Datadog instance
        const DATADOG_HOST = 'https://api.datadoghq.com';
        
        // Get AWS region from context
        const awsRegion = context.scope.region;

        const functionName = context.service.resourceName;

        let ddServiceName = null;

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
            
            // Look for DD_SERVICE tag
            ddServiceName = tagsResponse.Tags?.DD_SERVICE || tagsResponse.Tags?.['dd-service'];
            
            if (!ddServiceName) {
                logger.warn({
                    operation: 'aws-lambda-datadog-logs-alerts',
                    step: 'no-dd-service-tag',
                    functionName: functionName
                }, 'No DD_SERVICE tag found on Lambda function');
                return [];
            }
        } catch (error) {
            logger.error({
                operation: 'aws-lambda-datadog-logs-alerts',
                step: 'aws-lambda-error',
                functionName: functionName,
                error: error.message
            }, 'Error querying AWS Lambda tags');
            return [];
        }

        // Query Datadog for active alerts using the service tag
        const serviceTag = `service:${ddServiceName}`;
        const url = `${DATADOG_HOST}/api/v1/monitor?group_states=alert&monitor_tags=${encodeURIComponent(serviceTag)}`;
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'DD-API-KEY': secrets.DATADOG_API_KEY,
                    'DD-APPLICATION-KEY': secrets.DATADOG_APP_KEY,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Datadog API error: ${response.status} ${response.statusText}`);
            }

            let monitorList = await response.json();
            // Filter monitorList to only include monitors with overall_state === "Alert"
            monitorList = Array.isArray(monitorList)
                ? monitorList.filter(monitor => monitor.overall_state === "Alert")
                : [];
            const activeAlertsCount = monitorList.length || 0;

            // Build Datadog logs and alerts URLs for this service
            const logsUrl = `${DATADOG_HOST}/logs?query=${encodeURIComponent(serviceTag)}`;
            const alertsUrl = `${DATADOG_HOST}/monitors/manage?q=tag%3A"${encodeURIComponent(serviceTag)}`;

            const results = [
                {
                    type: 'link',
                    content: `${activeAlertsCount} alert${activeAlertsCount === 1 ? '' : 's'}`,
                    href: alertsUrl,
                    status: activeAlertsCount > 0 ? 'important' : 'success',
                    icon: 'datadog'
                },
                { 
                    type: 'link', 
                    content: 'Logs', 
                    href: logsUrl, 
                    icon: 'datadog' 
                }
            ];

            return results;

        } catch (error) {
            logger.error({
                operation: 'aws-lambda-datadog-logs-alerts',
                step: 'datadog-api-error',
                ddServiceName: ddServiceName,
                error: error.message
            }, 'Error querying Datadog API');
            return [];
        }
    }
};
