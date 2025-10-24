# GitHub Actions Cleanup Script

This script deletes all GitHub Actions workflow run history and artifacts for the tooljump/tooljump repository.

## Setup

1. Install dependencies:
   ```bash
   yarn install
   ```

2. Set your GitHub token as an environment variable:
   ```bash
   export GITHUB_SCRIPT_TOKEN=your_github_token_here
   ```

   Or create a `.env` file in this directory:
   ```
   GITHUB_SCRIPT_TOKEN=your_github_token_here
   ```

## Usage

Run the cleanup script:
```bash
yarn start
```

## What it does

- Deletes all workflow run artifacts first
- Then deletes all workflow run history
- Uses pagination to handle large numbers of runs
- Includes rate limiting to avoid GitHub API limits
- Provides progress logging

## Requirements

- Node.js with fetch support (Node 18+)
- GitHub token with `repo` scope permissions
- The token must have admin access to the tooljump/tooljump repository

## Warning

This will permanently delete ALL workflow run history and artifacts. This action cannot be undone.
