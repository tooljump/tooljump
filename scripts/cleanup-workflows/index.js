require('dotenv').config();

const GITHUB_TOKEN = process.env.GITHUB_SCRIPT_TOKEN;
const REPO_OWNER = 'tooljump';
const REPO_NAME = 'tooljump';

if (!GITHUB_TOKEN) {
  console.error('Error: GITHUB_SCRIPT_TOKEN environment variable is required');
  process.exit(1);
}

const GITHUB_API_BASE = 'https://api.github.com';

async function makeGitHubRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'tooljump-cleanup-script',
      ...options.headers
    }
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  return response;
}

async function getAllWorkflowRuns() {
  console.log('Fetching all workflow runs...');
  const runs = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const url = `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/actions/runs?per_page=${perPage}&page=${page}`;
    const response = await makeGitHubRequest(url);
    const data = await response.json();
    
    if (data.workflow_runs.length === 0) {
      break;
    }
    
    runs.push(...data.workflow_runs);
    console.log(`Fetched page ${page}, total runs so far: ${runs.length}`);
    page++;
  }

  console.log(`Found ${runs.length} total workflow runs`);
  return runs;
}

async function deleteWorkflowRun(runId) {
  const url = `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/actions/runs/${runId}`;
  await makeGitHubRequest(url, { method: 'DELETE' });
}

async function deleteAllArtifacts() {
  console.log('Deleting all artifacts...');
  let page = 1;
  const perPage = 100;

  while (true) {
    const url = `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/actions/artifacts?per_page=${perPage}&page=${page}`;
    const response = await makeGitHubRequest(url);
    const data = await response.json();
    
    if (data.artifacts.length === 0) {
      break;
    }
    
    for (const artifact of data.artifacts) {
      console.log(`Deleting artifact: ${artifact.name} (ID: ${artifact.id})`);
      const deleteUrl = `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/actions/artifacts/${artifact.id}`;
      await makeGitHubRequest(deleteUrl, { method: 'DELETE' });
    }
    
    page++;
  }
}

async function main() {
  try {
    console.log(`Starting cleanup of GitHub Actions for ${REPO_OWNER}/${REPO_NAME}`);
    
    // First delete all artifacts
    await deleteAllArtifacts();
    
    // Then delete all workflow runs
    const runs = await getAllWorkflowRuns();
    
    console.log(`Deleting ${runs.length} workflow runs...`);
    for (let i = 0; i < runs.length; i++) {
      const run = runs[i];
      console.log(`Deleting run ${i + 1}/${runs.length}: ${run.name} (ID: ${run.id})`);
      await deleteWorkflowRun(run.id);
      
      // Add a small delay to avoid rate limiting
      if (i % 10 === 0 && i > 0) {
        console.log('Pausing briefly to avoid rate limits...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log('Cleanup completed successfully!');
    
  } catch (error) {
    console.error('Error during cleanup:', error.message);
    process.exit(1);
  }
}

main();
