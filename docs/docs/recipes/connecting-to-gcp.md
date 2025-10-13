---
id: connecting-to-gcp
title: Connecting to GCP
---

# Connecting to GCP

Google Cloud Platform (GCP) is a scalable, on‑demand cloud computing platform.

## Correlating other tools with GCP

Suggested reading: [Best practices for uniformly tagging and correlating resources across your organization](../connecting-your-tools-resources).

In order to best leverage GCP, your infrastructure and other tools must be properly labeled so that they can be easily found in GCP.

For example, any infrastructure for the "webshop" service should be labeled with `service=webshop` and `repository=company/webshop` so you can easily identify them.

## Authenticating to GCP

Depending on your situation, there are a number of approaches you can use, all with pros and cons. Carefully review the options below and choose the one that best fits your scenario:

### Option 1: Give Tooljump access to the resources you need

Use this if:
- ✅ Tooljump runs in GCP and all resources you are interested in are in the same project

When your service runs **inside GCP** (Compute Engine, Cloud Run, Cloud Functions, GKE), you don’t need any long‑lived keys.  
Instead, you attach a **service account** to the compute resource, and the GCP environment automatically provides **short‑lived credentials** to the application via the metadata server.  
Google client libraries then use **Application Default Credentials (ADC)** to obtain and refresh these credentials automatically.

#### How It Works
- **Compute Engine (GCE)**: attach a **service account** to the VM and grant only the required IAM roles.  
- **Cloud Run / Cloud Functions**: configure the **service account** the service runs as.  
- **GKE**: use **Workload Identity** to bind a Kubernetes service account to a Google service account with the needed roles.  
- Client libraries automatically use **ADC** (no explicit credentials in code).

#### Benefits
- No long‑lived keys.  
- Automatic rotation of temporary credentials.  
- Least‑privilege access (scoped IAM roles).  
- Easy to revoke by changing the service account or roles.  

#### Example: Accessing Cloud Storage with ADC (Node.js)

```js
import { Storage } from "@google-cloud/storage";

const storage = new Storage(); // Uses ADC from the environment

const [files] = await storage.bucket("my-bucket").getFiles({ prefix: "read-prefix/" });
console.log(files.map(f => f.name));
```

### Option 2: Cross‑project IAM or Service Account Impersonation

Use this option if all the following are true:
- ✅ You have multiple GCP projects
- ✅ Tooljump runs in one project but needs to read from another project

When your service runs in **another GCP project** (e.g., same organization, vendor project, or partner project), you can grant it access without creating long‑lived keys.  
You can do this by either granting the running service account direct IAM access on the target resources, or by allowing it to **impersonate** a service account in the target project.

#### How It Works
- In the **target project** (that Tooljump needs to read from):  
  - Option A (direct): Grant your caller service account the minimal IAM roles on the target resources (e.g., Storage Object Viewer on a bucket).  
  - Option B (impersonation): Create or choose a **target service account** with the minimal roles needed on the resources. Grant the caller service account `roles/iam.serviceAccountTokenCreator` on this target service account.  
- In the **caller project** (where Tooljump runs):  
  - The application uses ADC for its own service account.  
  - If using impersonation, it requests short‑lived credentials to act as the target service account and uses those credentials for API calls.  

#### Benefits
- No long‑lived keys.  
- Short‑lived credentials (time‑boxed sessions).  
- Easy to revoke by removing IAM bindings.  
- Least‑privilege access with fine‑grained roles.

##### Example: IAM Binding on Target Bucket (direct access)
Grant the Tooljump service account viewer access to a bucket in the target project:

```json
{
  "bindings": [
    {
      "role": "roles/storage.objectViewer",
      "members": [
        "serviceAccount:tooljump-sa@caller-project.iam.gserviceaccount.com"
      ]
    }
  ]
}
```

##### Example: Allow Impersonation of a Target Service Account
Grant the caller service account permission to impersonate the target service account:

```json
{
  "bindings": [
    {
      "role": "roles/iam.serviceAccountTokenCreator",
      "members": [
        "serviceAccount:tooljump-sa@caller-project.iam.gserviceaccount.com"
      ]
    }
  ]
}
```

Then the application can use ADC to obtain short‑lived credentials for the target service account and call APIs with those credentials.

##### Example: Caller Code (Node.js, ADC)
When using direct IAM on the resources, no code changes are required beyond standard ADC usage:

```js
import { Storage } from "@google-cloud/storage";

const storage = new Storage(); // ADC (service account in caller project)

const [files] = await storage.bucket("my-bucket").getFiles({ prefix: "read-prefix/" });
console.log(files.map(f => f.name));
```

### Option 3: Service Account Key (JSON file)

If none of the role‑based solutions are possible, you can create a **service account key** (JSON) and use it as fixed credentials.  
This approach should only be used as a **last resort**, because long‑lived keys are hard to rotate and carry higher security risks.

#### How It Works
- Create a service account with the minimal roles needed.  
- Generate a **key (JSON)** for that service account.  
- Store it securely (e.g., in a secrets manager or vault).  
- The backend service sets `GOOGLE_APPLICATION_CREDENTIALS` to the path of the JSON key, and client libraries will use it via ADC.  

#### Risks
- ❌ Long‑lived credentials can be leaked or compromised.  
- ❌ Key rotation is manual and error‑prone.  
- ❌ Harder to revoke quickly compared to role‑based access.  

#### Hardening Measures
- Attach **minimal IAM roles**; avoid broad roles.  
- Use **organization policies** and **VPC Service Controls** where applicable.  
- Restrict access to the key file and monitor its usage with **Cloud Audit Logs**.  
- Rotate keys frequently (e.g., every 30 - 60 days).  
- Store keys in a **secrets manager**, for example in `@tooljump/secrets-env`. More information [here](../writing-integrations/secrets.md)

#### Example: Usage in Node.js (JSON key)
```js
import { Storage } from "@google-cloud/storage";

// Ensure process.env.GOOGLE_APPLICATION_CREDENTIALS points to the JSON key
const storage = new Storage();

const [files] = await storage.bucket("my-bucket").getFiles({ prefix: "read-prefix/" });
console.log(files.map(f => f.name));
```

## Using the GCP SDK to retrieve data from GCP

To retrieve data from GCP, use the official Google Cloud client libraries (e.g., `@google-cloud/*`) for accessing services like Cloud Storage, BigQuery, and Pub/Sub.

