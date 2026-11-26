---
title: "Web Assessment — HTTP Verb Tampering"
date: 2026-11-26 17:47:00 +0530
categories: [CPTS, Web]
tags: ["WEB"]
description: Compare authorization and request processing across supported HTTP methods.
permalink: "/posts/cpts-web-verb-tampering/"
toc: true
---

Compare authorization and request processing across supported HTTP methods.

> Use this methodology only for systems and test identities within an explicitly authorized assessment. Validate the minimum necessary impact and preserve sanitized evidence.
{: .tip }

## Assessment workflow

### 1. Map intended methods

Document each endpoint, supported HTTP methods and the expected permission for each operation. Capture an authorized request and response.

### 2. Compare authorization consistently

Use synthetic resources and approved identities. Review whether reverse proxies, framework routing and application authorization make consistent decisions across permitted methods.

### 3. Inspect method overrides

Review whether the platform supports method override headers or form fields. Determine how the effective method is resolved and whether the authorization layer sees the same operation as the handler.

### 4. Retest restrictions

Apply authorization in the application for each operation, restrict unsupported methods and ensure filters operate on normalized requests.

## Decision checklist

| If you observe | Then check | Next action |
| --- | --- | --- |
| OPTIONS advertises unexpected methods | Compare with intended deployment and actual handler configuration. | An advertised method alone is not a vulnerability. |
| Different methods return different access responses | Confirm whether they represent the same protected operation. | Review routing and authorization order. |
| A proxy and application interpret methods differently | Review effective method and handler logs. | Align policy enforcement across layers. |

## Common mistakes and missed checks

- Treating HTTP 200 as proof of unauthorized access.
- Ignoring implicit framework behavior such as HEAD.
- Testing destructive methods against real records.

## When to stop and reassess

Stop after a synthetic resource demonstrates the inconsistency; do not alter real data.

## Expected deliverable

Endpoint, HTTP method, effective handler, identity and expected/observed authorization.

## Related methodology

- [Complete penetration testing methodology]({{ '/posts/cpts-methodology/' | relative_url }})
- [Phase 05 — Web Application Vulnerability Assessment]({{ '/posts/cpts-phase-05-web-vulnerabilities/' | relative_url }})

## Study basis

Adapted from CPTS study topics: Web Attacks: Intro to HTTP Verb Tampering, Basic Authentication, Security Filters and Prevention. The sequencing and validation criteria are an editorial synthesis for a public assessment reference.
