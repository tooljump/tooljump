---
id: connecting-to-azure
title: Connecting to Azure
---

# Connecting to Azure

Microsoft Azure is a scalable, on‑demand cloud computing platform.

## Correlating other tools with Azure

Suggested reading: Best practices for uniformly tagging and correlating resources across your organization.

In order to best leverage Azure, your infrastructure and other tools must be properly tagged so that they can be easily found in Azure (Azure resources support key/value `tags`).

For example, any infrastructure for the "webshop" service should be tagged with `service=webshop` and `repository=company/webshop` so you can easily identify them.

## Authenticating to Azure

Depending on your situation, there are a number of approaches you can use, all with pros and cons. Carefully review the options below and choose the one that best fits your scenario:

### Option 1: Give ToolJump access to the resources you need

Use this if:
- ✅ ToolJump runs in Azure and all resources you are interested in are in the same tenant/subscription

When your service runs **inside Azure** (VM, App Service, Functions, Container Apps, AKS), you don’t need any long‑lived secrets.  
Instead, you attach a **Managed Identity** (system‑assigned or user‑assigned) to the compute resource. Azure automatically provides **short‑lived tokens** via the Instance Metadata Service (IMDS), and Azure SDKs use **DefaultAzureCredential** to obtain and refresh these credentials automatically.

#### How It Works
- **Azure VM / App Service / Functions / Container Apps**: enable a **Managed Identity** on the resource and grant it the minimal RBAC roles on target resources (e.g., Storage Blob Data Reader).  
- **AKS**: use **Azure AD Workload Identity** to bind a Kubernetes service account to an Entra ID application/managed identity.  
- Client libraries automatically use **DefaultAzureCredential (DAC)**; no explicit secrets in code.

#### Benefits
- No long‑lived client secrets or keys.  
- Automatic rotation of short‑lived tokens.  
- Least‑privilege access via scoped RBAC roles.  
- Easy to revoke by removing role assignments or the identity.  

#### Example: Accessing Azure Blob Storage with DAC (Node.js)

```js
import { DefaultAzureCredential } from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";

const accountName = "myaccount";
const containerName = "my-container";
const prefix = "read-prefix/";

const credential = new DefaultAzureCredential();
const blobService = new BlobServiceClient(`https://${accountName}.blob.core.windows.net`, credential);
const container = blobService.getContainerClient(containerName);

const names = [];
for await (const blob of container.listBlobsFlat({ prefix })) {
  names.push(blob.name);
}
console.log(names);
```

### Option 2: Cross‑subscription/project RBAC or Workload Identity Federation

Use this option if all the following are true:
- ✅ You have multiple subscriptions or resource groups
- ✅ ToolJump runs in one scope but needs to read from another

You can grant access without creating long‑lived secrets by either assigning RBAC on the target scope to the caller’s identity, or by using **Workload Identity Federation** to obtain short‑lived tokens for a target app identity.

#### How It Works
- In the **target subscription/resource group/resource**:  
  - Option A (direct RBAC): Assign minimal roles (e.g., `Storage Blob Data Reader`) to the caller’s managed identity or app registration principal.  
  - Option B (federation): Configure an Entra ID application with **federated credentials** and grant it minimal roles on the target resources; allow the caller workload to obtain short‑lived tokens for that app (DefaultAzureCredential supports this in AKS/Workload Identity scenarios).  
- In the **caller environment**:  
  - Use **DefaultAzureCredential**; it automatically exchanges tokens when federation is configured, or uses the caller’s managed identity when direct RBAC is used.  

#### Benefits
- No long‑lived secrets.  
- Short‑lived, time‑boxed credentials.  
- Easy to revoke by removing RBAC or federation bindings.  
- Least‑privilege access with fine‑grained roles.

##### Example: RBAC role assignment (conceptual)
Grant the ToolJump identity read access to a storage account scope:

```json
{
  "roleDefinition": "Storage Blob Data Reader",
  "principalId": "<object-id-of-caller-identity>",
  "scope": "/subscriptions/<sub>/resourceGroups/<rg>/providers/Microsoft.Storage/storageAccounts/<account>"
}
```

##### Example: Caller Code (Node.js, DAC)
With either direct RBAC or federation configured, code remains the same:

```js
import { DefaultAzureCredential } from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";

const credential = new DefaultAzureCredential();
const blobService = new BlobServiceClient(`https://myaccount.blob.core.windows.net`, credential);
const container = blobService.getContainerClient("my-container");

for await (const blob of container.listBlobsFlat({ prefix: "read-prefix/" })) {
  console.log(blob.name);
}
```

### Option 3: Service Principal with Client Secret (Fixed Credentials)

If none of the identity‑based solutions are possible, you can create an **Entra ID application (service principal)** with a client secret or certificate.  
This approach should only be used as a **last resort**, because long‑lived secrets are hard to rotate and carry higher security risks.

#### How It Works
- Register an application in Entra ID and create a **client secret** (or certificate).  
- Grant the app minimal RBAC roles on the resources.  
- Store the secret securely (e.g., in a secrets manager or vault).  
- The backend can use `ClientSecretCredential` or `DefaultAzureCredential` via environment variables.

#### Risks
- ❌ Long‑lived secrets can be leaked or compromised.  
- ❌ Secret rotation is manual and error‑prone.  
- ❌ Harder to revoke quickly compared to managed identities.  

#### Hardening Measures
- Grant **minimal roles**; avoid broad, subscription‑wide reader roles unless necessary.  
- Use **management group policies** and **Azure Policy** to constrain behavior.  
- Restrict access to the secret; monitor with **Azure Activity Logs**.  
- Rotate secrets frequently (e.g., every 30 - 60 days).  
- Store secrets in a **secrets manager**, for example in `@tooljump/secrets-env`. More information [here](../writing-integrations/secrets.md)

#### Example: Usage in Node.js (Client secret)
```js
import { ClientSecretCredential } from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";

const tenantId = process.env.AZURE_TENANT_ID!;
const clientId = process.env.AZURE_CLIENT_ID!;
const clientSecret = process.env.AZURE_CLIENT_SECRET!;

const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
const blobService = new BlobServiceClient(`https://myaccount.blob.core.windows.net`, credential);
const container = blobService.getContainerClient("my-container");

const names = [];
for await (const blob of container.listBlobsFlat({ prefix: "read-prefix/" })) {
  names.push(blob.name);
}
console.log(names);
```

## Using the Azure SDK to retrieve data from Azure

To retrieve data from Azure, use the official Azure SDKs with `@azure/identity` (for credentials) and the corresponding service client libraries (e.g., `@azure/storage-blob`, `@azure/arm-resources`, `@azure/monitor-query`). Prefer `DefaultAzureCredential` for production to benefit from managed identity or workload identity where available.

