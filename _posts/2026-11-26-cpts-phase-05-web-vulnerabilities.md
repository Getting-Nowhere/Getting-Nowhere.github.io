---
title: "Phase 05 — Web Application Vulnerability Assessment"
date: 2026-11-26 17:55:00 +0530
categories: [CPTS, Web]
tags: ["WEB"]
description: Select a dedicated validation workflow based on the observed input and security boundary.
permalink: "/posts/cpts-phase-05-web-vulnerabilities/"
toc: true
---

Select a dedicated validation workflow based on the observed input and security boundary.

> Use this methodology only for systems and test identities within an explicitly authorized assessment. Validate the minimum necessary impact and preserve sanitized evidence.
{: .tip }

## Assessment workflow

### 1. Start from evidence

Use a captured baseline request and the application map. Identify the input, expected behavior, role and expected boundary before selecting a testing method.

### 2. Classify the vulnerability family

Distinguish browser-side execution from query interpretation, command processing, file handling, object authorization, XML processing and authentication. A single route may require multiple independent assessments.

### 3. Use safe controlled comparisons

Use unique harmless markers, synthetic records and designated test accounts. Compare response semantics and application logs where available. Avoid accessing real users’ data or executing unnecessary code.

### 4. Determine impact and remediation

Record the violated trust boundary, prerequisites and affected roles. Explain the plausible consequences separately from demonstrated effects. Apply a targeted remediation and retest with the same baseline.

## Decision checklist

| If you observe | Then check | Next action |
| --- | --- | --- |
| Text rendered in HTML, JavaScript or DOM | Review output encoding and sinks. | XSS |
| Database-backed input | Review query construction and parameterization. | SQL injection and SQLMap |
| OS-backed input | Review process invocation and argument handling. | Command injection |
| File path or upload | Review path containment and file handling. | File inclusion or file upload |
| Object reference, role or method | Review server-side authorization. | IDOR, mass assignment or verb tampering |
| XML input | Review entity and external resource handling. | XXE |
| Login flow | Review account protections. | Authentication assessment. |

## Common mistakes and missed checks

- Equating a server error with successful injection.
- Testing multiple changing inputs in the same request.
- Confusing missing authentication with missing object-level authorization.

## When to stop and reassess

Stop at sufficient evidence of the boundary failure; do not expand the impact demonstration without agreement.

## Expected deliverable

A set of reproducible, classified findings with an evidence-backed remediation path.

## Related methodology

- [Complete penetration testing methodology]({{ '/posts/cpts-methodology/' | relative_url }})
- [Web Assessment — Cross-Site Scripting (XSS)]({{ '/posts/cpts-web-xss/' | relative_url }})
- [Web Assessment — SQL Injection and SQLMap]({{ '/posts/cpts-web-sqli/' | relative_url }})
- [Web Assessment — OS Command Injection]({{ '/posts/cpts-web-command-injection/' | relative_url }})
- [Web Assessment — File Inclusion and Path Handling]({{ '/posts/cpts-web-file-inclusion/' | relative_url }})
- [Web Assessment — File Upload Security]({{ '/posts/cpts-web-file-upload/' | relative_url }})
- [Web Assessment — Insecure Direct Object References (IDOR)]({{ '/posts/cpts-web-idor/' | relative_url }})
- [Web Assessment — XML External Entity (XXE) Handling]({{ '/posts/cpts-web-xxe/' | relative_url }})
- [Web Assessment — HTTP Verb Tampering]({{ '/posts/cpts-web-verb-tampering/' | relative_url }})
- [Web Assessment — Login and Account Protection]({{ '/posts/cpts-web-authentication/' | relative_url }})
- [Web Assessment — LDAP Injection and Mass Assignment]({{ '/posts/cpts-web-additional/' | relative_url }})

## Study basis

Adapted from CPTS study topics: Web Pentesting; Web Attacks; Attacking Common Applications. The sequencing and validation criteria are an editorial synthesis for a public assessment reference.
