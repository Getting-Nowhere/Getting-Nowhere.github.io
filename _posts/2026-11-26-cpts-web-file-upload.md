---
title: "Web Assessment — File Upload Security"
date: 2026-11-26 17:50:00 +0530
categories: [CPTS, Web]
tags: ["WEB"]
description: Review upload validation, storage, retrieval and downstream processing without using executable files.
permalink: "/posts/cpts-web-file-upload/"
toc: true
---

Review upload validation, storage, retrieval and downstream processing without using executable files.

> Use this methodology only for systems and test identities within an explicitly authorized assessment. Validate the minimum necessary impact and preserve sanitized evidence.
{: .tip }

## Decision tree

```text
Normal upload
  |-- UI rejects -> inspect client-side rules
  |-- Server rejects -> identify server-side validation
  `-- Server accepts -> inspect stored name, type and access
       |-- Downloaded -> authorization and disposition
       |-- Rendered -> content isolation
       `-- Processed -> parser and safe failure behavior
```

## Test each upload control independently

Start by uploading an approved, harmless file through the normal UI. Record filename, MIME type, multipart field, response and resulting resource URL. Verify what the server actually stored.

```bash
printf 'assessment fixture\n' > assessment.txt
file assessment.txt
```

Use a disposable assessment record; do not upload executable content to shared production paths.

| Observation | Next check |
|---|---|
| UI rejects the file before transmission | Inspect the client-side validation logic; verify server independently with harmless fixtures |
| Request is rejected server-side | Identify whether extension, declared MIME or content signature caused rejection |
| Server accepts but renames file | Determine normalized name, storage location and access policy |
| File is downloadable | Check owner versus other test-role authorization |
| File is rendered inline | Review content type, disposition, isolation and browser interpretation |
| Image or document is transformed | Identify parser, processing stage and safe failure behavior |

The source notes distinguish blacklist filters, whitelist filters, client-side validation and MIME/type filters. A declared `Content-Type` is supplied by the client; it is not proof of actual file contents. A filename extension does not establish how the server serves or interprets a resource.

### Common misses

- Testing only UI validation and never server validation.
- Confusing acceptance with execution.
- Ignoring normalized names, generated URLs and file ownership.
- Forgetting asynchronous processing, size limits and cleanup.

**Study-note basis:** Absent Validation, Client Side Validation, Blacklist Filters, Whitelist Filters, Type Filters, Limited File Uploads, Other Upload Attacks, Mitigations.

## Assessment workflow

### 1. Map the complete file lifecycle

Identify accepted formats, maximum size, authentication, metadata, storage location, retrieval URL and any conversion or preview operation.

### 2. Establish valid upload behavior

Upload a small harmless approved file and record its server-assigned name, content type and retrieval permissions. Compare acceptance and retrieval using separate test accounts.

### 3. Assess every validation layer

Determine whether restrictions are enforced by client-side code, server-side extension checks, MIME declarations or content parsing. Use benign fixtures with controlled metadata and mismatched declared types only as allowed.

### 4. Review storage and processing boundaries

Check whether files are stored outside executable directories, whether filenames are randomized, whether download authorization is enforced and whether previews use isolated processors.

### 5. Retest controls

Apply server-side allowlisting, content validation, size limits, non-executable storage, safe names and access control on retrieval.

## Decision checklist

| If you observe | Then check | Next action |
| --- | --- | --- |
| Restriction exists only in the browser | Check whether server independently validates a benign invalid fixture. | Confirm server enforcement. |
| Uploaded file is publicly retrievable | Compare intended access with anonymous and approved account access. | Assess storage and retrieval authorization. |
| Server transforms or previews files | Review parser configuration and isolation. | Check resource limits and content handling. |
| Upload appears to succeed but cannot be retrieved | Inspect server response and storage lifecycle. | Do not equate acceptance with execution. |

## Common mistakes and missed checks

- Checking only filename extensions or only MIME headers.
- Ignoring retrieval authorization and downstream transformations.
- Assuming a successful upload is remote code execution.

## When to stop and reassess

Do not upload active content, web shells, destructive files or resource-exhaustion fixtures to public systems.

## Expected deliverable

Upload and retrieval evidence, validation layer, storage/processing configuration and remediation.

## Related methodology

- [Complete penetration testing methodology]({{ '/posts/cpts-methodology/' | relative_url }})
- [Phase 05 — Web Application Vulnerability Assessment]({{ '/posts/cpts-phase-05-web-vulnerabilities/' | relative_url }})

## Study basis

Adapted from CPTS study topics: File Upload Attacks: Absent Validation, Client-side Validation, Type and Extension Filters, Limited Uploads and Mitigations. The sequencing and validation criteria are an editorial synthesis for a public assessment reference.
