module.exports = {
    metadata: {
        name: 'github-circleci-browse-deployment',
        description: 'Dropdown to browse the deployed revisions (staging, QA) on GitHub using CircleCI workflows',
        match: {
            contextType: 'github',
            context: {
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
        const branch = 'main';

        // Conventional workflow names used by many teams; customize if needed
        const WORKFLOWS = {
            staging: 'deploy-staging',
            prod: 'deploy-prod'
        };

        const headers = {
            'Circle-Token': secrets.CIRCLECI_API_TOKEN,
            'Accept': 'application/json'
        };

        async function getDeployedShaForWorkflow(workflowName) {
            // Use Insights to find the most recent successful run for the workflow on the target branch
            const insightsUrl = `${CIRCLE_HOST}/insights/${encodeURIComponent(projectSlug)}/workflows/${encodeURIComponent(workflowName)}?branch=${encodeURIComponent(branch)}`;
            const r1 = await fetch(insightsUrl, { headers });
            if (!r1.ok) throw new Error(`CircleCI insights error (${workflowName}): ${r1.status} ${r1.statusText}`);
            const j1 = await r1.json();
            const items = Array.isArray(j1.items) ? j1.items : [];
            const success = items.find(i => i.status === 'success');
            if (!success) return null;

            // Resolve pipeline id from pipeline number so we can get VCS revision (commit SHA)
            const byNumberUrl = `${CIRCLE_HOST}/project/${encodeURIComponent(projectSlug)}/pipeline/${success.pipeline_number}`;
            const r2 = await fetch(byNumberUrl, { headers });
            if (!r2.ok) throw new Error(`CircleCI pipeline lookup error: ${r2.status} ${r2.statusText}`);
            const j2 = await r2.json();
            const pipelineId = j2.id;
            if (!pipelineId) return null;

            const pipelineUrl = `${CIRCLE_HOST}/pipeline/${pipelineId}`;
            const r3 = await fetch(pipelineUrl, { headers });
            if (!r3.ok) throw new Error(`CircleCI pipeline fetch error: ${r3.status} ${r3.statusText}`);
            const j3 = await r3.json();
            const sha = j3.vcs && j3.vcs.revision;
            return sha || null;
        }

        const [stagingSha, prodSha] = await Promise.all([
            getDeployedShaForWorkflow(WORKFLOWS.staging),
            getDeployedShaForWorkflow(WORKFLOWS.prod)
        ]);

        const items = [];
        if (stagingSha) {
            items.push({ content: 'Staging', href: `https://github.com/${repo}/tree/${stagingSha}` });
        }
        if (prodSha) {
            items.push({ content: 'Prod', href: `https://github.com/${repo}/tree/${prodSha}` });
        }

        if (items.length === 0) return [];

        return [{
            type: 'dropdown',
            content: 'Browse deployment',
            icon: 'github',
            items
        }];
    }
};
