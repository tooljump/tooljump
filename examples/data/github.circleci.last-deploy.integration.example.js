module.exports = {
    metadata: {
        name: 'github-circleci-last-deploy',
        description: 'Show when main was last deployed to production (deploy-prod workflow) and link to the workflow run',
        match: {
            contextType: 'github',
            context: {
                'url': { exists: true },
                'page.repository': { startsWith: 'my-org/' }
            }
        },
        requiredSecrets: ['CIRCLECI_API_TOKEN'],
        cache: 300
    },
    run: async function (context, secrets = {}) {
        const CIRCLE_HOST = 'https://circleci.com/api/v2';
        const repo = context.page.repository; // e.g., "org/repo"
        const projectSlug = `gh/${repo}`;
        const workflowName = 'deploy-prod';
        const branch = 'main';

        // Helper to format "Deployed 3d ago" / "Deployed 3h ago"
        function formatRelativeDuration(thenIso) {
            const then = new Date(thenIso).getTime();
            const now = Date.now();
            const diffMs = Math.max(0, now - then);
            const diffMin = Math.floor(diffMs / 60000);
            const diffHr = Math.floor(diffMin / 60);
            const diffDay = Math.floor(diffHr / 24);
            if (diffDay >= 1) return `Deployed ${diffDay}d ago`;
            if (diffHr >= 1) return `Deployed ${diffHr}h ago`;
            return `Deployed ${Math.max(1, diffMin)}m ago`;
        }

        const headers = {
            'Circle-Token': secrets.CIRCLECI_API_TOKEN,
            'Accept': 'application/json'
        };

        // Insights API: latest runs for a workflow on a branch
        const url = `${CIRCLE_HOST}/insights/${encodeURIComponent(projectSlug)}/workflows/${encodeURIComponent(workflowName)}?branch=${encodeURIComponent(branch)}`;
        const resp = await fetch(url, { headers });
        if (!resp.ok) {
            throw new Error(`CircleCI API error: ${resp.status} ${resp.statusText}`);
        }

        const json = await resp.json();
        const items = Array.isArray(json.items) ? json.items : [];
        const success = items.find(i => i.status === 'success');
        if (!success) {
            return [];
        }

        const workflowId = success.id; // workflow UUID
        const pipelineNumber = success.pipeline_number; // for deep link
        const stoppedAt = success.stopped_at || success.created_at;

        const relative = formatRelativeDuration(stoppedAt);
        const link = `https://app.circleci.com/pipelines/gh/${repo}/${pipelineNumber}/workflows/${workflowId}`;

        return [
            { type: 'link', content: relative, href: link, icon: 'circleci' }
        ];
    }
};

