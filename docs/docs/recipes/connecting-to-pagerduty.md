---
id: connecting-to-pagerduty
title: Connecting to PagerDuty
---

import Icon from '@site/src/components/Icon';

# Connecting to PagerDuty

<Icon name="pagerduty" size={32} /> PagerDuty is an incident response platform for alerting, on‑call, and incident management.

## Correlating other tools with PagerDuty

Suggested reading: Best practices for uniformly tagging and correlating resources across your organization.

To best leverage PagerDuty, use consistent naming and metadata so other tools can reliably relate services, teams, incidents, and runbooks.

Examples:
- <Icon name="link" size={16} /> Service naming: align PagerDuty service names with your system names (e.g., `webshop`).  
- <Icon name="link" size={16} /> Tags: use service tags like `service:webshop`, `team:platform`, `env:prod` for discoverability.  
- <Icon name="link" size={16} /> Descriptions/links: add repository URLs, dashboards, and runbooks to service descriptions.  
- <Icon name="link" size={16} /> Incident fields: use Incident Custom Fields (if enabled) for `service`, `component`, `customer`, severity, and runbook links.  
- <Icon name="link" size={16} /> Escalation policies: reflect team ownership and escalation paths; keep names consistent with team names.

## Authenticating to PagerDuty

Choose the method that best fits your scope and security posture.

### Option 1: REST API Key (recommended for single account)

Use this if:
- ✅ You need read access within a single PagerDuty account

Create a **REST API Key** (prefer a read‑only key where possible) in PagerDuty. Use it via the `Authorization: Token token=<KEY>` header against the v2 API.

#### Benefits
- Simple, account‑scoped, easy to rotate and revoke.  
- Works for incidents, on‑call, schedules, services, etc.  
- Least privilege when using read‑only keys and minimal roles.

#### Example: List recent incidents (Node.js)
```js
// Requires Node 18+ (global fetch)
const token = process.env.PAGERDUTY_TOKEN; // REST API Key (store securely)
const since = new Date(Date.now() - 24*60*60*1000).toISOString();

const res = await fetch(`https://api.pagerduty.com/incidents?since=${encodeURIComponent(since)}&limit=25`, {
  headers: {
    Authorization: `Token token=${token}`,
    Accept: 'application/vnd.pagerduty+json;version=2'
  }
});
if (!res.ok) throw new Error(`HTTP ${res.status}`);
const data = await res.json();
console.log((data.incidents || []).map(i => `#${i.incident_number} ${i.title} [${i.status}]`));
```

### Option 2: Events API v2 (emitting alerts)

Use this if:
- ✅ You need to send events/alerts into PagerDuty (not for reading data)

Create a service **Integration Key** (routing key) and send events to the **Events API v2**. This does not grant read access; it is for triggering incidents.

```js
// Send a trigger event (Node.js)
const routingKey = process.env.PAGERDUTY_ROUTING_KEY; // Integration Key
const event = {
  routing_key: routingKey,
  event_action: 'trigger',
  payload: {
    summary: 'Checkout latency is high',
    source: 'webshop-api',
    severity: 'error',
    component: 'checkout',
    group: 'payments',
  }
};
const r = await fetch('https://events.pagerduty.com/v2/enqueue', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(event)
});
console.log(r.status);
```

## Using the PagerDuty API to retrieve data

Use the **REST API v2** with proper headers and pagination handling.

- Base URL: `https://api.pagerduty.com`.  
- Accept header: `application/vnd.pagerduty+json;version=2`.  
- Auth header: `Authorization: Token token=<KEY>` or `Authorization: Bearer <ACCESS_TOKEN>`.  
- Pagination: use `limit` and `offset`; continue while `more` is `true`.  
- Filtering: use `since`/`until`, `statuses[]`, `service_ids[]`, `team_ids[]`, etc.  
- Rate limits: respect `X-RateLimit-Remaining` and back off on `429`.

#### Example: Get current on‑call users for a schedule (Node.js)
```js
const token = process.env.PAGERDUTY_TOKEN;
const scheduleId = 'P123456';
const res = await fetch(`https://api.pagerduty.com/oncalls?schedule_ids[]=${scheduleId}&limit=100`, {
  headers: {
    Authorization: `Token token=${token}`,
    Accept: 'application/vnd.pagerduty+json;version=2'
  }
});
const data = await res.json();
console.log((data.oncalls || []).map(o => `${o.user?.summary} (${o.escalation_level})`));
```

