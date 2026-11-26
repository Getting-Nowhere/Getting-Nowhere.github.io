---
title: "Web Assessment — File Inclusion and Path Handling"
date: 2026-11-26 17:51:00 +0530
categories: [CPTS, Web]
tags: ["WEB"]
description: Review local and remote file references, path containment and server-side inclusion behavior.
permalink: "/posts/cpts-web-file-inclusion/"
toc: true
---

Review local and remote file references, path containment and server-side inclusion behavior.

> Use this methodology only for systems and test identities within an explicitly authorized assessment. Validate the minimum necessary impact and preserve sanitized evidence.
{: .tip }

## Assessment workflow

### 1. Locate path-like inputs

Identify document viewers, language selectors, templates, download routes and other inputs that select files. Record valid identifiers and expected directories.

### 2. Distinguish read from inclusion

A file-read feature returns bytes; a server-side include can interpret content in a runtime-specific way. Review local and remote resource handling separately, along with the effective service identity.

### 3. Verify containment

Use a pre-created harmless fixture within an approved test directory and, if explicitly permitted, a fixture outside the intended directory. Review canonicalization, symlinks, allowed roots, extension rules and wrapper handling.

### 4. Assess downstream risk

Review whether writable files, logs or remote resources are reachable by an include operation. The existence of an inclusion weakness does not automatically demonstrate code execution.

### 5. Retest secure handling

Use fixed identifiers mapped to trusted files, canonical path validation, restrictive runtime configuration and least-privileged file permissions.

## Decision checklist

| If you observe | Then check | Next action |
| --- | --- | --- |
| Input selects a document or template | Identify the allowed base path and expected file type. | Check containment with test fixtures. |
| Application resolves a URL-like reference | Review whether remote retrieval is permitted. | Check outbound policy and allowed schemes with administrator evidence. |
| A readable file is interpreted as a template | Determine the runtime and trust boundary. | Record potential execution risk without introducing executable content. |
| A path is blocked | Review normalization and server-side checks. | Do not assume one rejection establishes complete containment. |

## Common mistakes and missed checks

- Confusing path traversal with server-side inclusion.
- Ignoring symlinks, encoded path handling and file permissions.
- Using sensitive operating-system files when a synthetic marker would suffice.

## When to stop and reassess

Stop after demonstrating the path or inclusion boundary with a harmless fixture.

## Expected deliverable

The affected file-selection input, expected root, observed containment behavior and runtime-specific mitigation.

## Related methodology

- [Complete penetration testing methodology]({{ '/posts/cpts-methodology/' | relative_url }})
- [Phase 05 — Web Application Vulnerability Assessment]({{ '/posts/cpts-phase-05-web-vulnerabilities/' | relative_url }})

## Study basis

Adapted from CPTS study topics: File Inclusion: Introduction, Local File Inclusion, PHP Filters, File Disclosure and RCE. The sequencing and validation criteria are an editorial synthesis for a public assessment reference.
