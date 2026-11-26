---
title: "Web Assessment — Login and Account Protection"
date: 2026-11-26 17:46:00 +0530
categories: [CPTS, Web]
tags: ["WEB"]
description: Review login forms, HTTP authentication, password policy and account-level protections.
permalink: "/posts/cpts-web-authentication/"
toc: true
---

Review login forms, HTTP authentication, password policy and account-level protections.

> Use this methodology only for systems and test identities within an explicitly authorized assessment. Validate the minimum necessary impact and preserve sanitized evidence.
{: .tip }

## Assessment workflow

### 1. Identify authentication flows

Map form-based login, HTTP authentication, API tokens and alternative login interfaces. Record expected success/failure signals, redirects and session creation.

### 2. Review account protection policy

Confirm lockout, throttling, MFA, error message consistency and monitoring. Obtain a specific approved test budget before any repeated attempts.

### 3. Assess controlled behavior

Use dedicated accounts and a tiny predefined set of known test cases. Compare invalid and valid responses, lockout behavior and whether alternative endpoints enforce equivalent restrictions.

### 4. Understand attack categories

Dictionary attacks use a predefined candidate set, hybrid attacks modify candidates, exhaustive guessing explores a space, and password spraying distributes attempts across identities. These are distinct risk scenarios and require explicit testing limits.

### 5. Retest protections

Enforce MFA where appropriate, strong password policy, rate limiting, account-safe lockout, consistent errors and monitoring. Verify success still works after failed test attempts.

## Decision checklist

| If you observe | Then check | Next action |
| --- | --- | --- |
| Different errors reveal account existence | Compare approved test accounts and nonexistent synthetic identities. | Review consistent responses. |
| An alternate interface uses different controls | Compare its authentication policy with the main login. | Check coverage across interfaces. |
| No throttling is observed | Verify configuration and logs with the owner. | Do not increase attempt volume without authorization. |
| A valid account authenticates | Record the actual role and session behavior. | Continue to authorized access assessment. |

## Common mistakes and missed checks

- Mistaking redirects or response length for successful login.
- Ignoring secondary login endpoints.
- Testing without a lockout policy, attempt budget or recovery plan.

## When to stop and reassess

Stop at the agreed attempt limit or any lockout indication; never use leaked or third-party credentials.

## Expected deliverable

Authentication-flow map, approved test conditions, observed protection behavior and remediation.

## Related methodology

- [Complete penetration testing methodology]({{ '/posts/cpts-methodology/' | relative_url }})
- [Phase 07 — Credentials, Authentication and Access Assessment]({{ '/posts/cpts-phase-07-authentication/' | relative_url }})

## Study basis

Adapted from CPTS study topics: Login Brute Forcing: Dictionary, Hybrid, Brute Force, Hydra, Medusa and Custom Wordlists. The sequencing and validation criteria are an editorial synthesis for a public assessment reference.
