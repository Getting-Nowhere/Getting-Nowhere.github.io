---
title: "Web Assessment — LDAP Injection and Mass Assignment"
date: 2026-11-26 17:45:00 +0530
categories: [CPTS, Web]
tags: ["WEB"]
description: Review directory-backed input, server-side property binding and other application-specific exposure.
permalink: "/posts/cpts-web-additional/"
toc: true
---

Review directory-backed input, server-side property binding and other application-specific exposure.

> Use this methodology only for systems and test identities within an explicitly authorized assessment. Validate the minimum necessary impact and preserve sanitized evidence.
{: .tip }

## Assessment workflow

### 1. Review LDAP-backed functions

Locate directory searches and directory-backed authentication. Inspect whether untrusted values are inserted into LDAP filters and whether escaping follows the specific filter context.

### 2. Review model binding

Identify fields the client is allowed to update. Compare approved updates against synthetic objects and inspect whether the server binds unapproved fields such as role, ownership or status.

### 3. Review server-specific disclosure

For IIS, identify whether short-name behavior is enabled and whether it reveals otherwise hidden resource names. For CGI, identify runtime and patch configuration; do not infer a vulnerability solely from an executable endpoint.

### 4. Apply explicit controls

Use safe filter construction, property allowlists, server-side authorization, supported runtimes and appropriate configuration hardening. Retest using controlled fixtures.

## Decision checklist

| If you observe | Then check | Next action |
| --- | --- | --- |
| Directory filter is built dynamically | Review filter escaping and input boundaries. | Check code or test logs for safe handling. |
| JSON contains fields not exposed in the UI | Review allowed property schema and role restrictions. | Use a synthetic record to verify enforcement. |
| IIS or CGI is identified | Verify product/runtime version and enabled features. | Phase 06: product-specific review. |

## Common mistakes and missed checks

- Assuming hidden form fields cannot be changed.
- Treating LDAP filter escaping as interchangeable with HTML encoding.
- Confusing product detection with vulnerability confirmation.

## When to stop and reassess

Stop at a reproducible configuration or authorization discrepancy.

## Expected deliverable

Documented input/property boundary and product-specific configuration recommendations.

## Related methodology

- [Complete penetration testing methodology]({{ '/posts/cpts-methodology/' | relative_url }})
- [Phase 06 — Common Enterprise Applications]({{ '/posts/cpts-phase-06-common-applications/' | relative_url }})

## Study basis

Adapted from CPTS study topics: Attacking Common Applications: LDAP, Web Mass Assignment Vulnerabilities, IIS Tilde Enumeration and CGI. The sequencing and validation criteria are an editorial synthesis for a public assessment reference.
