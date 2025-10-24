module.exports = {
    metadata: {
        name: 'github-datadog-logs-alerts',
        description: 'Show any active alerts from Datadog in Github, and jump from Github to Logs and Alerts for this repository',
        match: {
            contextType: 'github',
            context: {
                'page.repository': { startsWith: 'my-org/' }
            }
        },
        requiredSecrets: ['DATADOG_API_KEY', 'DATADOG_APP_KEY'],
        cache: 300
    },
    run: async function (context, secrets = {}) {

        // adjust this to your Datadog instance
        const DATADOG_HOST = 'https://api.datadoghq.com';
        
        // assume the alerts for services belonging to this repository are tagged using the repository tag
        const repoTag = `repository:${context.page.repository}`;

        // if using Datadog EU instance, please change the url accordingly
        const url = `${DATADOG_HOST}/api/v1/monitor?group_states=alert&monitor_tags=${encodeURIComponent(repoTag)}`;
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

        monitorList = await response.json();
        // Filter monitorList to only include monitors with overall_state === "Alert"
        monitorList = Array.isArray(monitorList)
            ? monitorList.filter(monitor => monitor.overall_state === "Alert")
            : [];
        const activeAlertsCount = monitorList.length || 0;
  
        // Build Datadog logs and alerts URLs for this repository
        const logsUrl = `${DATADOG_HOST}/logs?query=${encodeURIComponent(repoTag)}`;
        const alertsUrl = `${DATADOG_HOST}/monitors/manage?q=tag%3A"${encodeURIComponent(repoTag)}`;

        const results = [
            {
                type: 'link',
                content: `${activeAlertsCount} alert${activeAlertsCount === 1 ? '' : 's'}`,
                href: alertsUrl,
                status: activeAlertsCount > 0 ? 'important' : 'success',
                icon: 'datadog'
            },
            { type: 'link', content: 'Logs', href: logsUrl, icon: 'datadog' }
        ];

        return results;
    }
};
