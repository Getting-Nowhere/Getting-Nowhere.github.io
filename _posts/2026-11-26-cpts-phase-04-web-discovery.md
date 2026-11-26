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

## Decision tree

```text
HTTP endpoint
  |-- Baseline is stable -> directory and extension discovery
  |-- Wildcard response -> measure and filter baseline
  |-- Host header changes response -> confirm distinct in-scope virtual host
  `-- Endpoint accepts input -> capture request -> choose vulnerability family
```

## Practical FFUF workflow

### 1. Establish a response baseline

```bash
curl -i http://TARGET/
curl -i http://TARGET/robots.txt
curl -i http://TARGET/nonexistent-assessment-marker
```

Record status, response length, title, redirects and cookies. A custom 404 or wildcard virtual host can return HTTP 200 for every candidate.

### 2. Discover directories and extensions

```bash
ffuf -w WORDLIST:FUZZ -u http://TARGET/FUZZ
ffuf -w EXTENSIONS:FUZZ -u http://TARGET/indexFUZZ
ffuf -w WORDLIST:FUZZ -u http://TARGET/KNOWN_DIR/FUZZ.php
ffuf -w WORDLIST:FUZZ -u http://TARGET/FUZZ -recursion -recursion-depth 1 -e .php -v
```

Use a small approved list first. Choose extensions based on observed server technology, not every extension you know. Restrict request rate and recursion to the agreed budget.

### 3. Virtual hosts versus DNS subdomains

```bash
ffuf -w SUBDOMAIN_LIST:FUZZ -u http://TARGET/ -H 'Host: FUZZ.DOMAIN'
ffuf -w SUBDOMAIN_LIST:FUZZ -u http://TARGET/ -H 'Host: FUZZ.DOMAIN' -fs BASELINE_SIZE
```

A Host-header match is not necessarily a DNS record. Confirm each distinct response manually and check its scope before accessing it. If every result looks identical, measure the wildcard response and filter on size instead of blindly discarding status 200.

### 4. Identify request parameters

Use the observed request and an authorized parameter list, with inert test values.

```bash
ffuf -w PARAM_LIST:FUZZ -u 'http://TARGET/endpoint?FUZZ=marker' -fs BASELINE_SIZE
ffuf -w PARAM_LIST:FUZZ -u http://TARGET/endpoint -X POST -d 'FUZZ=marker' -H 'Content-Type: application/x-www-form-urlencoded' -fs BASELINE_SIZE
curl -i http://TARGET/endpoint -X POST -d 'known_parameter=marker' -H 'Content-Type: application/x-www-form-urlencoded'
```

If POST results differ from the UI, compare the original Content-Type and encoding; JSON and multipart bodies are not interchangeable with form encoding. Confirm the input actually affects behavior before selecting a vulnerability test.

| Result | Next step |
|---|---|
| Same status and size for every candidate | Rebuild baseline; check wildcard responses |
| Distinct 301/302 | Inspect Location; follow only in-scope redirects |
| 401/403 | Record authorization boundary; compare with assigned role |
| Different response length or title | Reproduce manually in proxy |
| Parameter accepted but no visible output | Check request side effects using synthetic data |

**Study-note basis:** Directory Fuzzing, Filtering Results, Vhost Fuzzing, GET Parameter, POST Parameter Fuzzing, Web Proxy.

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
