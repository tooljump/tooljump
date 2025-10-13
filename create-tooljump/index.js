#!/usr/bin/env node

import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function promptForProjectName() {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'What is your project name?',
      default: 'my-tooljump-project',
      validate: (input) => {
        if (!input.trim()) {
          return 'Project name cannot be empty';
        }
        if (!/^[a-z0-9-]+$/.test(input)) {
          return 'Project name can only contain lowercase letters, numbers, and hyphens';
        }
        return true;
      }
    }
  ]);
  
  return answers.projectName;
}

async function promptForTokenPassword() {
  const answers = await inquirer.prompt([
    {
      type: 'password',
      name: 'tokenPassword',
      message: 'Enter TokenAuth password which protects your server (will be stored in a local .env file):',
      mask: '*',
      validate: (input) => {
        const token = input.trim();
        if (!token) {
          return 'Password cannot be empty';
        }
        if (token.length < 8) {
          return 'Password must be at least 8 characters long';
        }
        const hasUpperCase = /[A-Z]/.test(token);
        const hasLowerCase = /[a-z]/.test(token);
        const hasNumber = /[0-9]/.test(token);
        const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(token);

        if (!hasUpperCase) {
          return 'Password must contain at least one uppercase letter';
        }
        if (!hasLowerCase) {
          return 'Password must contain at least one lowercase letter';
        }
        if (!hasNumber) {
          return 'Password must contain at least one number';
        }
        if (!hasSpecialChar) {
          return 'Password must contain at least one special character';
        }
        return true;
      }
    }
  ]);
  return answers.tokenPassword;
}

async function createProject(projectName, tokenPassword) {
  const projectPath = path.join(process.cwd(), projectName);
  
  // Create project directory
  await fs.ensureDir(projectPath);
  await fs.ensureDir(path.join(projectPath, 'data'));
  
  // Create .env and .env.sample
  const envContent = `TOOLJUMP_TOKEN_AUTH=${tokenPassword}`;
  const envSampleContent = `TOOLJUMP_TOKEN_AUTH=`;
  await fs.writeFile(path.join(projectPath, '.env'), envContent + "\n");
  await fs.writeFile(path.join(projectPath, '.env.sample'), envSampleContent + "\n");
  
  console.log(`Creating Tooljump project: ${projectName}`);
  
  // Create package.json
  const packageJson = {
    name: projectName,
    version: "1.0.0",
    description: "My ToolJump project",
    main: "dist/server.js",
    scripts: {
      "dev": "ts-node-dev --respawn --transpile-only server.ts",
      "build": "tsc",
      "start": "node dist/server.js"
    },
    dependencies: {
      "@tooljump/core": "^1.0.0",
      "@tooljump/secrets-env": "^1.0.0",
      "@tooljump/integrations-fs": "^1.0.0",
      "@tooljump/runner-vm": "^1.0.0",
      "@tooljump/cache-local": "^1.0.0",
      "@tooljump/auth-token": "^1.0.0",
      "@tooljump/logger": "^1.0.0",
      "@tooljump/common": "^1.0.0",
      "dotenv": "^16.0.0"
    },
    devDependencies: {
      "@types/node": "^20.0.0",
      "typescript": "^5.0.0",
      "ts-node-dev": "^2.0.0"
    }
  };
  
  await fs.writeJson(path.join(projectPath, 'package.json'), packageJson, { spaces: 2 });
  
  // Create server.ts
  const serverTs = `import path from 'path';
import 'dotenv/config';
import { Tooljump } from '@tooljump/core';
import { EnvSecrets } from '@tooljump/secrets-env';
import { FsIntegrations } from '@tooljump/integrations-fs';
import { VMRunner } from '@tooljump/runner-vm';
import { LocalCache } from '@tooljump/cache-local';
import { TokenAuth } from '@tooljump/auth-token';
import { LoggerFactory } from '@tooljump/logger';
import { DEFAULT_CONFIG } from '@tooljump/common';

// Initialize the logger - use development config for examples
const logger = LoggerFactory.initialize(
    LoggerFactory.createDevelopmentLogger()
);

// Default config includes all adapters (AWS, Github, Generic)
// You can modify it to only include the adapters you need
const config = DEFAULT_CONFIG;

const tooljump = new ToolJump({
    logger,
    config,
    // any secrets that your integrations need will be loaded from the environment variables
    secrets: new EnvSecrets({ logger }),
    // this reads your integrations from the ./data directory
    // while this is a default approach for local development,
    // you should use the GithubIntegrations to ensure your integrations
    // are stored in source control and can be reviewed and versioned
    // check documentation for more details
    integrations: new FsIntegrations({
        logger,
        config,
        path: path.join(process.cwd(), './data'),
        watchFiles: true
    }),
    runner: new VMRunner({ logger }),
    // the cache is used to store the results of the integrations
    // for development or when running in a single-node environment
    // the cache can be local, but you can implement your own cache
    // if you want to use a remote cache (eg: Redis, Memcached)
    cache: new LocalCache({
        logger,
        size: 1000,
    }),
    // the auth is used to authenticate the requests to the server
    // you can use the TokenAuth to authenticate the requests
    // or you can implement your own auth system
    auth: new TokenAuth({
        logger,
        token: process.env.TOOLJUMP_TOKEN_AUTH as string
    }),
});

// start the server and listen on port 3000
tooljump.start();`;
  
  await fs.writeFile(path.join(projectPath, 'server.ts'), serverTs);
  
  // Create tsconfig.json
  const tsConfig = {
    compilerOptions: {
      target: "ES2019",
      module: "commonjs",
      declaration: true,
      outDir: "dist",
      rootDir: ".",
      strict: true,
      esModuleInterop: true,
      skipLibCheck: false
    },
    include: ["**/*"],
    exclude: ["node_modules", "dist"]
  };
  
  await fs.writeJson(path.join(projectPath, 'tsconfig.json'), tsConfig, { spaces: 2 });
  
  // Create .gitignore
  const gitignore = `dist
node_modules
.env
*.log
.DS_Store`;
  
  await fs.writeFile(path.join(projectPath, '.gitignore'), gitignore);
  
  // Create README.md
  const readme = `# ${projectName}

A Tooljump project for creating context-aware browser extensions.

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

3. Build the project:
   \`\`\`bash
   npm run build
   \`\`\`

## Project Structure

- \`server.ts\` - Main server file
- \`data/\` - Directory containing integration files
- \`dist/\` - Built files (generated)

## Integration Files

Add your integration files to the \`data/\` directory. Each integration should export a metadata object and a run function.

See the example \`github.integration.js\` file for reference.

## Configuration

The server uses environment variables for configuration. A \`.env\` file is generated with:

\`\`\`
TOOLJUMP_TOKEN_AUTH=your-token-here
\`\`\`

You can see the template in \`.env.sample\`. Update \`.env\` as needed.

## Learn More

Visit the [Tooljump documentation](https://tooljump.dev) for more information about creating integrations and configuring your project.`;
  
  await fs.writeFile(path.join(projectPath, 'README.md'), readme);
  
  // Copy github.integration.js template
  const githubIntegration = `module.exports = {
    metadata: {
        name: 'example-github-insights',
        description: 'Shows sample insights for a GitHub repository',
        match: {
            contextType: 'github',
            context: {
                'page.repository': { equals: 'tooljump/tooljump' }
            }
        },
        cache: 300
    },
    run: async function (context, secrets = {}, dataFiles = []) {
        const results = [
            { type: 'link', content: '3 alerts active', href: 'https://www.npmjs.com/package/lunr-languages', status: 'important', icon: 'datadog' },
            { type: 'link', content: 'Logs', href: 'https://www.npmjs.com/package/lunr-languages', icon: 'datadog' },
            { type: 'link', content: 'Cost 30d: $351', href: 'https://www.npmjs.com/package/lunr-languages' },
            { type: 'link', content: 'Oncall: John', href: 'https://www.npmjs.com/package/lunr-languages', icon: 'pagerduty' },
            { type: 'link', content: '#my-service-channel', href: 'https://www.npmjs.com/package/lunr-languages', icon: 'slack' },
            { type: 'link', content: 'Last deployed 3d ago', href: 'https://www.npmjs.com/package/lunr-languages', icon: 'circleci' },
            { 
                type: 'dropdown',
                content: 'Deployment URLs',
                items: [
                    { content: 'Dev: http://dev.my.service', href: 'http://dev.my.service' },
                    { content: 'QA: http://qa.my.service', href: 'http://qa.my.service' },
                    { content: 'Prod: http://prod.my.service', href: 'http://prod.my.service', status: 'important' }
                ]
            },
            { 
                type: 'dropdown',
                content: 'More',
                items: [
                    { content: 'Docs', href: 'http://dev.my.service', icon: 'confluence' },
                    { content: 'Postman collections', href: 'http://qa.my.service', icon: 'postman' }
                ]
            }
        ];

        return results;
    }
};`;
  
  await fs.writeFile(path.join(projectPath, 'data', 'github.integration.js'), githubIntegration);
  
  console.log(`\n✅ Project created successfully!`);
  console.log(`\nNext steps:`);
  console.log(`  cd ${projectName}`);
  console.log(`  npm install`);
  console.log(`  npm run dev`);
  console.log(`Follow the documentation from https://tooljump.dev/docs/getting-started to learn more about ToolJump and how to create integrations.`);
}

async function main() {
  try {
    const args = process.argv.slice(2);
    let projectName;
    let tokenPassword;
    
    if (args.length > 0) {
      projectName = args[0];
    } else {
      projectName = await promptForProjectName();
    }
    tokenPassword = await promptForTokenPassword();
    
    await createProject(projectName, tokenPassword);
  } catch (error) {
    console.error('Error creating project:', error);
    process.exit(1);
  }
}

main();

