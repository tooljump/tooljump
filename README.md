# ToolJump

A context-aware integration platform that provides intelligent tools and information based on the current context.

## Launch

1. one command to start the server, install the extension and open a github repo to show it augemented. like /onboarding
    - one command starts the server
    - at the end opens the /onboading URL in google chrome
    - marks the page with green when the extension is installed
    - presses a button to configure it
    - presses a link to open a demo repository to show the bar at the top
    - next guides etc etc
2. running in your company

# When starting locally (easy mode)
## Server
1. Load files under integrations
    - load `*.data.yml` (and store all data as an array)
    - load `data.process.js` (pass data for processing)
    - load `*.integration.js` (build an internal array with the integrations metadata and run function)
2. Run server on `localhost:3999` (for safety)
3. Install the extension

# When starting in a company environment
## Server
1. Use the arg to point to a github repo (and path) where the data exist. Also, a gh token with read access is needed
2. Periodically reload (git pull) (every 5 minutes)
3. Parse the files
4. Listen on a given port, and require a token that must be set in the extension


# TODO
- check how I can get the extension verified/signed by Google
- guides on how to generate read only tokens
- add 3 ways to run custom stuff: require, vm or isolated-vm




# Secrets
- read from ENV (only once, on startup)
- read from external store, eg: AWS, Vault


# TODO CODE
[v] - auth that is based on a shared token [express middleware]
- data provider
- config UI for extension to set server url  and token (if token based)

# DATA
1. One big call to get everything (at startup)
2. Go through files that include .data.yml or .data.json, then execute some data.preprocess.js
2. Call something (or read some file) from within integrations (eg: read the service-catalog.yml in the current repo)

# EXTENSION
1. get corresponding configuration, driven by the server preferably (like /config) which will return how the FE should behave
2. implement context for AWS



## 📋 Requirements

- **Node.js**: Version 20 or higher (required for lru-cache compatibility)
- **Yarn**: Package manager
- **Git**: Version control

## 🚀 Automated Builds

This project uses GitHub Actions for automated builds. All builds are **private** and generate ZIP artifacts only.

### Available Workflows:

1. **Extension Build** (`.github/workflows/extension-build.yml`)
   - Triggers on changes to `extension/` folder
   - Builds and packages the extension
   - Creates production and development ZIP files
   - Uploads as private artifacts

2. **Extension Test** (`.github/workflows/extension-test.yml`)
   - Validates extension build process
   - Ensures all files are present
   - Tests packaging functionality

3. **Monorepo Build** (`.github/workflows/monorepo-build.yml`)
   - Builds all packages in the monorepo
   - Includes extension packaging
   - Uploads extension ZIP as artifact

### How to Access Build Artifacts:

1. Go to your GitHub repository
2. Click on "Actions" tab
3. Select a completed workflow run
4. Scroll down to "Artifacts" section
5. Download the ZIP files

### Manual Trigger:

You can manually trigger builds:
1. Go to "Actions" tab
2. Select a workflow
3. Click "Run workflow" button
4. Choose branch and click "Run workflow"

### Privacy:

- ✅ All builds are **private**
- ✅ No public releases created
- ✅ ZIP files only available to you
- ✅ No Chrome Web Store integration
- ✅ No public distribution






All product names, logos, trademarks, service marks, and any associated images or screenshots used or referenced in this project are the property of their respective owners. Any such use is for identification and reference purposes only and does not imply any affiliation with, endorsement by, or sponsorship of ToolJump by those owners.