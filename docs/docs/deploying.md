---
id: deploying
title: Deploying ToolJump
sidebar_label: Deploying
keywords: [deploying tooljump, production deployment, docker deployment, kubernetes, self-hosted deployment]
description: Complete guide to deploying ToolJump in production environments including Docker, Kubernetes, and cloud deployment strategies for enterprise teams.
---

# Deploying ToolJump

This guide covers deploying ToolJump in various environments, from local development to production deployments.

:::warning
One of the key differences between the local and production deployment is the integration adapter you use. Locally, it is perfectly fine to use the `@tooljump/integration-fs` adapter which reads the integrations from the disk, however when running in production, we **strongly** recommend using the `@tooljump/integration-github`, which fetches the integrations from Github. Using the Github adapters ensure you can store your integrations in source control and apply the usual code review process, just like you do for every other project in your organisation
:::

Learn more about [integrations architecture](/docs/server-architecture).

As seen in the snippet below, the GithubIntegrations requires 3 parameters:
* accessToken - a personal access token designed to have read only access to the repository holding your integrations files
* repoUrl - the full path of the Github repo, in the format of https://github.com/my-org/my-repo
* repoPath - the relative path to the folder where the integrations are stored (eg: integrations)

```javascript
import { GithubIntegrations } from '@tooljump/integrations-github';
...
integrations: new GithubIntegrations({
    logger,
    config,
    accessToken: process.env.GITHUB_TOKEN!,
    repoUrl: process.env.GITHUB_REPO_URL!,
    repoPath: process.env.GITHUB_REPO_PATH!,
    enableWatching: true,
    watchInterval: 300,
}),
...
```

We recommend creating a fine grained personal access token, limiting the scope only to the repository holding your integrations and only to **Repository permissions → Contents: Read-only** permission.

## VPS Deployment

For deploying ToolJump on a virtual private server (VPS), you can run it directly as a Node.js application without Docker.

### Prerequisites

- Node.js installed on your VPS
- A domain name pointing to your server's IP address
- SSL certificate for HTTPS (recommended using Let's Encrypt)
- The server needs to have outgoing network access (to connect to Github and other tools), as well as incoming access to be able to serve requests

### Basic Setup

1. Clone your ToolJump repository to the server
2. Install dependencies using `yarn install`
3. Configure environment variables for your integrations
4. Start the server with `yarn start` or `node dist/index.js`. Consider using pm2 or systemd to keep your node server online.

### Security Considerations

- Ensure your server is properly configured with a firewall
- Use HTTPS to secure communication between the extension and server
- Consider using a reverse proxy like Nginx for additional security and performance
- Keep your server and dependencies updated regularly

Ensure your deployment follows our [security best practices](/docs/security).

The ToolJump server runs as an Express web server, so make sure to expose the appropriate port (typically 3000) and configure your domain to point to your server's public IP address.

## Docker Deployment

For containerized deployments, you can use Docker to package and run ToolJump with all its dependencies.

### Dockerfile Template

Create a `Dockerfile` in your ToolJump project root:

```dockerfile
# Use Node.js LTS as base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./
COPY packages/*/package.json ./packages/*/

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN yarn build

# Expose port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Start the application
CMD ["node", "dist/index.js"]
```

### Deployment Steps

1. Build the Docker image: `docker build -t tooljump .`
2. (Optional) Push the image to your container registry (e.g., Docker Hub, GitHub Container Registry):  
   `docker tag tooljump your-username/tooljump:latest`  
   `docker push your-username/tooljump:latest`
3. Or run directly: `docker run -p 3000:3000 --env-file .env your-username/tooljump:latest` (your .env file should contain the secrets for integrations as well as your github token and github connection details)

### Benefits of Docker Deployment

- Consistent environment across different systems
- Easy scaling and orchestration
- Simplified dependency management
- Better isolation and security
- Easy integration with container orchestration platforms (Kubernetes, Docker Swarm)

## Kubernetes Deployment

For production deployments at scale, Kubernetes provides robust orchestration, scaling, and management capabilities.

### Prerequisites

- Kubernetes cluster (local with minikube/kind, or cloud provider like GKE, EKS, AKS)
- kubectl configured to access your cluster
- Docker image pushed to a container registry

### Basic Deployment

Create a `k8s-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tooljump
  labels:
    app: tooljump
spec:
  replicas: 2
  selector:
    matchLabels:
      app: tooljump
  template:
    metadata:
      labels:
        app: tooljump
    spec:
      containers:
      - name: tooljump
        image: your-username/tooljump:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: GITHUB_TOKEN
          valueFrom:
            secretKeyRef:
              name: tooljump-secrets
              key: github-token
        - name: GITHUB_REPO_URL
          valueFrom:
            configMapKeyRef:
              name: tooljump-config
              key: github-repo-url
        - name: GITHUB_REPO_PATH
          valueFrom:
            configMapKeyRef:
              name: tooljump-config
              key: github-repo-path
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: tooljump-service
spec:
  selector:
    app: tooljump
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: tooljump-config
data:
  github-repo-url: "https://github.com/your-org/your-repo"
  github-repo-path: "integrations"

```

### Deployment Steps

1. Create the ConfigMap and Secret:
   ```bash
   kubectl apply -f k8s-deployment.yaml
   ```
   
   **Better Secret Management**: Instead of storing secrets in YAML files, consider using:
   - `kubectl create secret generic tooljump-secrets --from-literal=github-token=your-token`
   - External secret management systems (AWS Secrets Manager, Azure Key Vault, etc.)
   - Sealed Secrets or External Secrets Operator for GitOps workflows

2. Verify deployment:
   ```bash
   kubectl get pods
   kubectl get services
   ```

3. Access the service:
   ```bash
   kubectl port-forward service/tooljump-service 3000:80
   ```

### Ingress Configuration

For HTTPS and domain routing, add an Ingress resource:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: tooljump-ingress
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - tooljump.yourdomain.com
    secretName: tooljump-tls
  rules:
  - host: tooljump.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: tooljump-service
            port:
              number: 80
```

### Benefits of Kubernetes Deployment

- Automatic scaling based on demand
- Rolling updates with zero downtime
- Built-in health checks and self-healing
- Resource management and limits
- Service discovery and load balancing
- Easy integration with monitoring and logging systems


