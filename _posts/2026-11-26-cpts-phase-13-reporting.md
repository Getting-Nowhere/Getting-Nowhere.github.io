---
title: "Phase 13 — Validation, Reporting and Closeout"
date: 2026-11-26 17:37:00 +0530
categories: [CPTS, Methodology]
tags: ["ENUMERATION"]
description: Turn observations into reproducible findings, verify remediation and complete the assessment responsibly.
permalink: "/posts/cpts-phase-13-reporting/"
toc: true
---

Turn observations into reproducible findings, verify remediation and complete the assessment responsibly.

> Use this methodology only for systems and test identities within an explicitly authorized assessment. Validate the minimum necessary impact and preserve sanitized evidence.
{: .tip }

## Assessment workflow

### 1. Validate findings

Confirm scope, identity, target, prerequisite and the expected security behavior. Repeat the minimum safe test needed to distinguish the observation from a false positive. Record any uncertainty or incomplete coverage.

### 2. Assess impact

Explain what boundary failed, who can reach it, what permissions are required and what the consequences could be. Separate demonstrated impact from hypothetical impact. Consider business context and affected data without disclosing unnecessary sensitive details.

### 3. Write actionable findings

Use a consistent structure: title, severity rationale, affected assets, prerequisites, expected behavior, observed behavior, sanitized evidence, impact, remediation and retest steps.

### 4. Complete coverage and handle blockers

Review the inventory and classify each test as confirmed, not observed, inconclusive, not tested or out of scope. Revisit unresolved leads only when new authorized evidence addresses the blocker.

### 5. Perform closeout

Remove temporary test artifacts, accounts and approved configuration changes; verify restoration with the owner. Secure or delete sensitive evidence according to agreed retention policy. Publish only sanitized educational examples.

### 6. Retest remediation

Replay the original controlled test using the same conditions and compare with expected behavior. Record fixed, partially fixed or unresolved status and any regression.

## Decision checklist

| If you observe | Then check | Next action |
| --- | --- | --- |
| Finding cannot be reproduced | Review target, identity, tool behavior and baseline. | Classify as inconclusive rather than confirmed. |
| A fix changes configuration | Verify intended functionality and security boundary. | Retest both legitimate and unauthorized test cases. |
| A new authorized access level becomes available | Update the inventory and re-run relevant enumeration. | Return to the appropriate phase. |
| Assessment is complete | Review scope coverage, artifacts and evidence redaction. | Deliver report and close outstanding items. |

## Common mistakes and missed checks

- Publishing real credentials, internal hostnames or client-specific evidence.
- Reporting scanner output as confirmed exploitation.
- Ignoring limitations, business context and retest criteria.

## When to stop and reassess

Close the engagement only after confirming evidence handling and cleanup with the responsible owner.

## Expected deliverable

An actionable assessment report, coverage matrix, cleanup record and retest plan.

## Related methodology

- [Complete penetration testing methodology]({{ '/posts/cpts-methodology/' | relative_url }})

## Study basis

Adapted from CPTS study topics: Editorial lifecycle synthesis; prevention and mitigation sections across CPTS modules. The sequencing and validation criteria are an editorial synthesis for a public assessment reference.
