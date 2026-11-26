---
title: "Phase 04 — Web Discovery, Fuzzing and Request Analysis"
date: 2026-11-26 17:56:00 +0530
categories: [CPTS, Web]
tags: ["ENUMERATION", "WEB"]
description: Map applications, request inputs, roles, and response behavior before vulnerability testing.
permalink: "/posts/cpts-phase-04-web-discovery/"
toc: true
---

Map applications, request inputs, roles, and response behavior before vulnerability testing.

> Use this methodology only for systems and test identities within an explicitly authorized assessment. Validate the minimum necessary impact and preserve sanitized evidence.
{: .tip }

## Assessment workflow

### 1. Identify application boundaries

Record scheme, host, port, virtual host, framework indicators, redirects and TLS configuration. Correlate each virtual host with its own application inventory.

### 2. Map functions and routes

Browse the application as an anonymous user and with approved test accounts. Record links, forms, API calls, parameters, content types, file operations and administrative surfaces. Keep separate route maps for each role.

### 3. Use controlled discovery

For approved content discovery, begin with a small representative input list and a known nonexistent path to establish the baseline. Compare status, response length, words and actual content rather than trusting a status code alone.

### 4. Capture and replay baseline requests

Use an intercepting proxy such as Burp Suite or ZAP. Preserve method, URL, headers, body, cookies and response metadata with secrets redacted. Vary one field at a time using harmless inputs.

### 5. Classify each input

Identify whether an input reaches an HTML context, database operation, OS-backed operation, file path, upload handler, object reference or XML parser. Route the observation to the relevant dedicated vulnerability page.

## Decision checklist

| If you observe | Then check | Next action |
| --- | --- | --- |
| A response contains user-controlled text | Determine the rendering context and whether it is stored. | Cross-site scripting. |
| A form affects search, filters or database-backed records | Compare normal and boundary-value responses. | SQL injection. |
| An identifier selects an object or resource | Compare access with two authorized test accounts. | IDOR. |
| A path, attachment or XML body is accepted | Identify the relevant server-side processing step. | File inclusion, upload or XXE. |
| An alternative method produces different authorization behavior | Compare the expected method with the observed access control. | HTTP verb tampering. |

## Read-only reference commands

Examples use an approved environment. Replace placeholders with authorized lab values. Commands are reference examples, not an instruction to run them against arbitrary hosts.

```bash
# Record headers and redirects for an authorized application
curl -I https://app.example.test/

# Capture a normal response for comparison
curl -sS -D baseline.headers -o baseline.body https://app.example.test/
```

## Common mistakes and missed checks

- Missing authenticated views, alternate hosts and API requests.
- False positives from wildcard routes, generic errors and redirects.
- Treating a client-side restriction as a server-side control.

## When to stop and reassess

Stop automated discovery if it exceeds agreed limits or reaches an unapproved hostname.

## Expected deliverable

An application map containing functions, roles, inputs, baselines and candidate vulnerability categories.

## Related methodology

- [Complete penetration testing methodology]({{ '/posts/cpts-methodology/' | relative_url }})
- [Phase 05 — Web Application Vulnerability Assessment]({{ '/posts/cpts-phase-05-web-vulnerabilities/' | relative_url }})

## Study basis

Adapted from CPTS study topics: Information Gathering – Web Edition; Attacking Web Apps with FFUF; Web Proxies. The sequencing and validation criteria are an editorial synthesis for a public assessment reference.
