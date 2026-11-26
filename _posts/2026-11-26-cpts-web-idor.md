---
title: "Web Assessment — Insecure Direct Object References (IDOR)"
date: 2026-11-26 17:49:00 +0530
categories: [CPTS, Web]
tags: ["WEB"]
description: Validate object-level authorization using paired test accounts and synthetic records.
permalink: "/posts/cpts-web-idor/"
toc: true
---

Validate object-level authorization using paired test accounts and synthetic records.

> Use this methodology only for systems and test identities within an explicitly authorized assessment. Validate the minimum necessary impact and preserve sanitized evidence.
{: .tip }

## Assessment workflow

### 1. Prepare two controlled identities

Create or obtain two approved accounts with equivalent roles and separate synthetic records. Record which account owns each object and which operations should be allowed.

### 2. Identify object references

Locate identifiers in route paths, query parameters, JSON bodies and hidden fields. Encoded or unpredictable identifiers do not replace an authorization check.

### 3. Build an authorization matrix

Test each permitted operation using the owner’s request, then compare with an approved non-owner test account. Keep the object and operation fixed so identity is the variable.

### 4. Review related endpoints

Check lists, exports, attachments and alternate API endpoints that refer to the same synthetic objects. Distinguish read, update and delete permissions; avoid destructive operations without an isolated fixture.

### 5. Retest server-side enforcement

Require authorization at the object and action level on every request, including alternate API routes. Confirm the owner still succeeds and the non-owner is denied.

## Decision checklist

| If you observe | Then check | Next action |
| --- | --- | --- |
| Identifier appears numeric or predictable | Treat it as a reference, not proof of a flaw. | Compare owner and non-owner requests against synthetic data. |
| Identifier is encoded or opaque | Identify the corresponding object through approved test records. | Verify access control regardless of encoding. |
| An account can view another test record | Capture the minimal synthetic evidence. | Check whether related operations independently enforce authorization. |
| A list hides an object but direct access is possible | Compare route-specific enforcement. | Report the missing object authorization rather than attempting mass enumeration. |

## Common mistakes and missed checks

- Confusing authentication with authorization.
- Checking only GET requests or only the web UI.
- Using real customer identifiers or bulk collection.

## When to stop and reassess

One controlled cross-account proof is sufficient for the affected operation; do not enumerate unrelated records.

## Expected deliverable

A paired-account request/response comparison with object ownership, role, operation and expected versus observed behavior.

## Related methodology

- [Complete penetration testing methodology]({{ '/posts/cpts-methodology/' | relative_url }})
- [Phase 05 — Web Application Vulnerability Assessment]({{ '/posts/cpts-phase-05-web-vulnerabilities/' | relative_url }})

## Study basis

Adapted from CPTS study topics: Web Attacks: Identifying IDORs, Encoded References, Chaining, Insecure APIs and Prevention. The sequencing and validation criteria are an editorial synthesis for a public assessment reference.
