module.exports = {
    metadata: {
        name: 'github-pagerduty-oncall',
        description: 'Show current L1 on-call for the first PagerDuty service tagged with this repository, with link to the On-Call view',
        match: {
            contextType: 'github',
            context: {
                'page.repository': { startsWith: 'my-org/' }
            }
        },
        requiredSecrets: ['PAGERDUTY_API_TOKEN'],
        cache: 900
    },
    run: async function (context, secrets = {}) {
        const PD_HOST = 'https://api.pagerduty.com'; // US API

        const repoTag = `repository:${context.page.repository}`;
        const headers = {
            'Authorization': `Token token=${secrets.PAGERDUTY_API_TOKEN}`,
            'Accept': 'application/vnd.pagerduty+json;version=2',
            'Content-Type': 'application/json'
        };

        // 1) Resolve the tag ID by label (exact match)
        const tagsResp = await fetch(`${PD_HOST}/tags?query=${encodeURIComponent(repoTag)}&limit=25`, { headers });
        if (!tagsResp.ok) {
            throw new Error(`PagerDuty API error (tags): ${tagsResp.status} ${tagsResp.statusText}`);
        }
        const tagsJson = await tagsResp.json();
        const tag = (tagsJson.tags || []).find(t => t.label === repoTag);
        if (!tag) {
            return [];
        }

        // 2) Find first service entity with this tag
        const entitiesResp = await fetch(`${PD_HOST}/tags/${encodeURIComponent(tag.id)}/entities?type=service&limit=25`, { headers });
        if (!entitiesResp.ok) {
            throw new Error(`PagerDuty API error (tag entities): ${entitiesResp.status} ${entitiesResp.statusText}`);
        }
        const entitiesJson = await entitiesResp.json();
        const service = (entitiesJson.entities || []).find(e => e.type === 'service');
        if (!service) {
            return [];
        }

        // 3) Fetch service to get escalation policy
        const serviceResp = await fetch(`${PD_HOST}/services/${encodeURIComponent(service.id)}?include[]=escalation_policy`, { headers });
        if (!serviceResp.ok) {
            throw new Error(`PagerDuty API error (service): ${serviceResp.status} ${serviceResp.statusText}`);
        }
        const serviceJson = await serviceResp.json();
        const ep = serviceJson.service && serviceJson.service.escalation_policy;
        if (!ep || !ep.id) {
            return [];
        }

        // 4) Query on-calls for this escalation policy and pick L1
        const oncallsResp = await fetch(`${PD_HOST}/oncalls?limit=25&escalation_policy_ids[]=${encodeURIComponent(ep.id)}`, { headers });
        if (!oncallsResp.ok) {
            throw new Error(`PagerDuty API error (oncalls): ${oncallsResp.status} ${oncallsResp.statusText}`);
        }
        const oncallsJson = await oncallsResp.json();
        const l1 = (oncallsJson.oncalls || []).find(o => o.escalation_level === 1);
        if (!l1 || !l1.user) {
            return [];
        }

        // Extract first name
        const fullName = l1.user.name || l1.user.summary || '';
        const firstName = fullName.split(' ')[0] || fullName;

        // 5) Build deep link to On-Call view filtered by service
        const oncallUrl = `https://app.pagerduty.com/oncalls?service_ids[]=${encodeURIComponent(service.id)}`;

        const results = [
            { type: 'link', content: `On-call: ${firstName}`, icon: 'pagerduty', href: oncallUrl },
        ];

        return results;
    }
};

