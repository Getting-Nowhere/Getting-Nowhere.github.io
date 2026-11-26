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

## Decision tree

```text
User-controlled resource reference
  |-- Path error -> identify base path and restrictions
  |-- Raw file response -> file-read boundary
  |-- Rendered content -> inclusion boundary
  `-- No difference -> check endpoint behavior and fixture
       -> Confirm using synthetic resource outside intended directory
```

## Identify the actual filesystem operation

The source notes illustrate four distinct PHP patterns:

```php
include($_GET['language']);
include("./languages/" . $_GET['language']);
include("lang_" . $_GET['language']);
include($_GET['language'] . ".php");
```

These are unsafe examples for source review, not recommended implementation. They differ in base path, prefix and suffix restrictions. A file download endpoint may only read a file, whereas `include` can interpret its content. Keep these findings separate.

### Validation using an approved fixture

1. Capture a request for an existing allowed resource.
2. Request a nonexistent harmless resource and record the error response.
3. Use an assessment fixture outside the intended resource directory, with owner approval, to test whether the directory boundary is enforced.
4. Record whether the result contains fixture data, an error, a redirect or ordinary page content.

```bash
curl -i 'http://TARGET/index.php?language=english'
curl -i 'http://TARGET/index.php?language=assessment-nonexistent'
```

| If observed | Next check |
|---|---|
| File path in error | Determine base directory and intended allowlist |
| Forced extension | Review suffix handling and path resolution |
| File is rendered | Distinguish file inclusion from download/read |
| Source-like data exposed | Check whether the fixture was intended to be accessible |
| Response blocked | Record boundary; do not assume it is universally enforced |

The original notes include PHP filters, automated scanning, log poisoning and inclusion-to-execution techniques. This public edition explains the underlying branches but omits file-extraction and code-execution chains. Use synthetic fixtures rather than operating system or application secrets.

**Study-note basis:** Local File Inclusion (LFI), Basic Bypasses, PHP Filters, Automated scanning, Log Poisoning.

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
