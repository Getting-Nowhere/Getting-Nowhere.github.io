---
title: "Web Assessment — SQL Injection and SQLMap"
date: 2026-11-26 17:53:00 +0530
categories: [CPTS, Web]
tags: ["WEB"]
description: Assess database-backed inputs, query semantics and the limits of automated SQL injection testing.
permalink: "/posts/cpts-web-sqli/"
toc: true
---

Assess database-backed inputs, query semantics and the limits of automated SQL injection testing.

> Use this methodology only for systems and test identities within an explicitly authorized assessment. Validate the minimum necessary impact and preserve sanitized evidence.
{: .tip }

## Assessment workflow

### 1. Identify a database-backed function

Map search, filtering, sorting, record lookup and login flows. Capture a valid request and expected response. Identify whether a database product is confirmed or inferred.

### 2. Establish a controlled comparison

Use synthetic values and permitted boundary inputs, changing one field at a time. Observe consistent changes in result sets, status, errors or application logs. A malformed request or generic exception is not sufficient proof of SQL injection.

### 3. Classify the observed behavior

Error-based injection exposes database errors; UNION-based behavior can affect returned result sets; Boolean-based and time-based blind behavior relies on indirect signals. Stacked queries depend on driver and database support. Do not presume support for one technique from another.

### 4. Evaluate automation responsibly

SQLMap can help characterize a confirmed candidate in an isolated test environment. Preserve the exact request, session context and intended parameter. Review its output, database fingerprint confidence and false-positive risk; obtain separate authorization before any data enumeration or state-changing tests.

### 5. Assess database boundaries

Review application database roles, file-system access and whether sensitive operations are unnecessarily granted. Demonstrate only with synthetic records or administrator-provided evidence. Do not infer OS command execution from SQL injection alone.

### 6. Retest the fix

Use prepared statements for values, allowlisted dynamic identifiers, least-privileged database accounts and generic client errors. Replay the original controlled comparisons after remediation.

## Decision checklist

| If you observe | Then check | Next action |
| --- | --- | --- |
| An input changes query results unexpectedly | Compare repeatable baseline and control cases. | Determine whether query construction, validation or ordinary application logic explains the difference. |
| Database errors appear | Capture a sanitized error and correlate with logs. | Confirm the actual database and code path. |
| Response differs without explicit database output | Check reproducibility, cache and normal timing variation. | Classify blind behavior only with controlled evidence. |
| Automation reports an injectable parameter | Review the request and independently reproduce a minimal non-destructive result. | Determine the affected operation and confidence. |
| File or OS capabilities are suspected | Inspect the database account grants and platform configuration. | Document potential impact; avoid file reads or command execution against real data. |

## Read-only reference commands

Examples use an approved environment. Replace placeholders with authorized lab values. Commands are reference examples, not an instruction to run them against arbitrary hosts.

```sql
# Example of a read-only query in an authorized test database
SELECT VERSION();
SELECT id, name FROM assessment_sample WHERE id = 1;
```

## Common mistakes and missed checks

- Misidentifying the DBMS from error text alone.
- Overlooking POST bodies, JSON, cookies or secondary processing of stored values.
- Trusting automated output without a reproducible baseline.
- Testing production latency with repeated heavy requests.

## When to stop and reassess

Park an inconsistent finding until you can reproduce it or review the query construction.

## Expected deliverable

The vulnerable input and request, affected database operation, evidence of unsafe query handling and a parameterization-based fix.

## Related methodology

- [Complete penetration testing methodology]({{ '/posts/cpts-methodology/' | relative_url }})
- [Phase 05 — Web Application Vulnerability Assessment]({{ '/posts/cpts-phase-05-web-vulnerabilities/' | relative_url }})

## Study basis

Adapted from CPTS study topics: SQL Injection: Databases, MySQL, Query Logic, UNION and Mitigation; SQLMap Essentials. The sequencing and validation criteria are an editorial synthesis for a public assessment reference.
