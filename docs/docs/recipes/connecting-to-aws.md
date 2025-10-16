---
id: connecting-to-aws
title: Connecting to AWS
keywords: [connecting to aws, aws integration, amazon web services, cloud integration, tooljump aws]
description: Step-by-step guide to connect AWS services with ToolJump including Lambda, EC2, S3, and other AWS resources for improved developer productivity.
---

import Icon from '@site/src/components/Icon';

# Connecting to AWS

<Icon name="aws" size={32} /> Amazon Web Services (AWS) is a scalable, on‑demand cloud computing platform.

## Correlating other tools with AWS

Suggested reading: Best practices for uniformly tagging and correlating resources across your organization.

In order to best leverage AWS, your infrastructure and other tools must be properly tagged so that they can be easily found in AWS.

For example, any infrastructure for the "webshop" service should be tagged with <Icon name="link" size={16} /> `service:webshop` and <Icon name="link" size={16} /> `repository:company/webshop` so you can easily identify them.

## Authenticating to AWS

Depending on your situation, there are a number of approaches you can use, all with pros and cons. Carefully review the options below and choose the one that best fits your scenario:

### Option 1: Give ToolJump access to the resources you need

Use this if:
- ✅ ToolJump runs in AWS and all resources you are interested in are in the same account

When your service runs **inside AWS** (EC2, ECS, Lambda, EKS), you don’t need any long-lived keys.  
Instead, you attach an **IAM role directly to the compute resource**, and the AWS environment automatically provides **temporary credentials** to the application.

#### How It Works
- **EC2**: attach an **instance profile role** to the instance.  
- **ECS/Fargate**: assign a **task role** to the container.  
- **Lambda**: configure the **execution role**.  
- **EKS**: use **IRSA** (IAM Roles for Service Accounts) to bind pods to IAM roles. Ensure the cluster has an OIDC provider and annotate the Kubernetes service account to reference the IAM role.  

AWS then automatically injects short-lived credentials into the runtime environment, and the AWS SDKs automatically pick these credentials up; no extra code required.

#### Benefits
- No long-lived access keys.  
- Automatic rotation of temporary credentials.  
- Least-privilege access (scoped policies per role).  
- Easy to revoke by detaching or modifying the role.  

#### Example: EC2 Instance Profile

**1. Create IAM role** with a minimal policy:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    { 
      "Effect": "Allow", 
      "Action": ["s3:GetObject"], 
      "Resource": "arn:aws:s3:::my-bucket/read-prefix/*" 
    }
  ]
}
```

**2. Attach the role** to your EC2 instance (via instance profile).

**3. Use it in code** (Node.js AWS SDK v3):
```js
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({ region: "eu-west-1" }); 
// No credentials needed  -  SDK auto-loads from instance metadata

const resp = await s3.send(new GetObjectCommand({
  Bucket: "my-bucket",
  Key: "read-prefix/example.txt"
}));

console.log(resp);
```
The same approach can be used for ECS, EKS or Lambda, with small changes.

### Option 2: Cross-account IAM Role + STS (Best for Access Between AWS Accounts)

Use this option if all the following are true:
- ✅ You have multiple AWS accounts
- ✅ ToolJump runs in one of the AWS accounts

When your service runs in **another AWS account** (e.g., same Organization, vendor account, or partner account), you can grant it access without creating long-lived keys.  
You do this by creating a **role in your account** and allowing the external AWS principal to **assume** it using AWS STS.

#### How It Works
- In **Account A** (the account that ToolJump needs to read from):  
  - Create a role with the minimal permissions required.  
  - Define a trust policy allowing a specific AWS principal (role or user) in **Account B** to assume it.  
- In **Account B** (where ToolJump runs):  
  - The service uses its existing AWS identity (role, user, or environment credentials).  
  - It calls `sts:AssumeRole` into Account A to receive short‑lived credentials (typically 15 minutes to 1 hour by default; up to 12 hours if allowed).  
- The AWS SDK automatically uses these temporary credentials for API calls.  

#### Benefits
- No long-lived access keys in your account.  
- Short-lived credentials (time-boxed sessions).  
- Easy to revoke by removing trust or changing conditions.  
- Least-privilege access with fine-grained policies.

For extra security, you can also harden the trust policy, for example:
- `"IpAddress": { "aws:SourceIp": ["203.0.113.0/24"] }` (ensure access can only be performed from an IP)
- `"StringEquals": { "aws:SourceVpce": "vpce-abc123" }` (ensure access can only be performed from a VPC)

You can also restrict by Organization ID using `aws:PrincipalOrgID`, and/or use session tags to scope access. Be mindful that `SourceIp` and `SourceVpce` conditions go in the trust policy’s `Condition` and can be impacted by NAT, mobile networks, or endpoint coverage.

##### Example: Trust Policy in Account A
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "AWS": "arn:aws:iam::222233334444:role/TheirCallerRole" },
    "Action": "sts:AssumeRole",
    "Condition": {
      "StringEquals": { "sts:ExternalId": "your-unique-external-id" }
    }
  }]
}
```

Note: Use a unique, hard‑to‑guess `sts:ExternalId` per integration or account to prevent confused‑deputy risks.

##### Example: Permissions in Account A Role
```json
{
  "Version": "2012-10-17",
  "Statement": [
    { 
      "Effect": "Allow", 
      "Action": ["s3:ListBucket"], 
      "Resource": "arn:aws:s3:::my-bucket" 
    },
    { 
      "Effect": "Allow", 
      "Action": ["s3:GetObject"], 
      "Resource": "arn:aws:s3:::my-bucket/read-prefix/*" 
    }
  ]
}
```

##### Example: Caller Code in Account B (Node.js AWS SDK v3)

Preferred: auto‑refreshing temporary credentials using a credential provider.

```js
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { fromTemporaryCredentials } from "@aws-sdk/credential-providers";

const s3 = new S3Client({
  region: "eu-west-1",
  credentials: fromTemporaryCredentials({
    params: {
      RoleArn: "arn:aws:iam::111122223333:role/YourLimitedReadRole",
      RoleSessionName: "svc-backend-001",
      ExternalId: "your-unique-external-id",
      DurationSeconds: 3600
    }
  })
});

const out = await s3.send(new ListObjectsV2Command({
  Bucket: "my-bucket",
  Prefix: "read-prefix/"
}));
console.log(out.Contents?.map(o => o.Key));
```

Manual example (explicit `AssumeRole`) if you need to manage credentials yourself:

```js
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

async function assume() {
  const sts = new STSClient({});
  const { Credentials } = await sts.send(new AssumeRoleCommand({
    RoleArn: "arn:aws:iam::111122223333:role/YourLimitedReadRole",
    RoleSessionName: "svc-backend-001",
    ExternalId: "your-unique-external-id",
    DurationSeconds: 3600
  }));
  if (!Credentials) throw new Error("AssumeRole failed");
  return Credentials;
}

async function run() {
  const creds = await assume();
  const s3 = new S3Client({
    region: "eu-west-1",
    credentials: {
      accessKeyId: creds.AccessKeyId,
      secretAccessKey: creds.SecretAccessKey,
      sessionToken: creds.SessionToken
    }
  });

  const out = await s3.send(new ListObjectsV2Command({
    Bucket: "my-bucket",
    Prefix: "read-prefix/"
  }));
  console.log(out.Contents?.map(o => o.Key));
}

run().catch(console.error);
```

### Option 3: IAM User + Access Keys (Fixed Credentials)

If none of the role-based solutions are possible, you can create an **IAM user** with access keys.  
This approach should only be used as a **last resort**, because long-lived keys are hard to rotate and carry higher security risks.

#### How It Works
- Create an IAM user in your account.  
- Generate an **access key + secret key** pair.  
- Store them securely (e.g., in a secrets manager or vault).  
- The backend service uses these credentials directly to call AWS APIs.  

#### Risks
- ❌ Long-lived credentials can be leaked or compromised.  
- ❌ Key rotation is manual and error-prone.  
- ❌ Harder to revoke quickly compared to roles.  

#### Hardening Measures
- Attach a **strict, custom policy**  -  avoid `ReadOnlyAccess` because it is too broad.  
- Use a **permission boundary** to cap the user’s maximum privileges.  
- Add **conditions** (e.g., allowed IPs, allowed VPC endpoints, allowed regions).  
- Rotate keys frequently (e.g., every 30 - 60 days).  
- Monitor with **CloudTrail + CloudWatch** for unexpected usage.  
- Use **SCPs** (if in an Organization) to deny sensitive actions or regions.  

#### Example: IAM User Policy (scoped to one bucket)
```json
{
  "Version": "2012-10-17",
  "Statement": [
    { 
      "Effect": "Allow", 
      "Action": ["s3:ListBucket"], 
      "Resource": "arn:aws:s3:::my-bucket" 
    },
    { 
      "Effect": "Allow", 
      "Action": ["s3:GetObject"], 
      "Resource": "arn:aws:s3:::my-bucket/read-prefix/*" 
    }
  ]
}
```

#### Example: Usage in Node.js (AWS SDK v3)
```js
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: "eu-west-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const out = await s3.send(new ListObjectsV2Command({
  Bucket: "my-bucket",
  Prefix: "read-prefix/"
}));

console.log(out.Contents?.map(o => o.Key));
```

#### Notes
- Only use fixed credentials when roles or federation are not possible.  
- Store the keys in a **secrets manager**, for example in `@tooljump/secrets-env`. More information [here](../writing-integrations/secrets.md)
- Rotate and audit keys regularly.
- Consider this a **temporary workaround**, not a long-term solution.

## Using the AWS SDK to retrieve data from AWS

To retrieve data from AWS, use the `@aws-sdk` v3 for reading data from AWS.
