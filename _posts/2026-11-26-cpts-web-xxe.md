---
title: "Web Assessment — XML External Entity (XXE) Handling"
date: 2026-11-26 17:48:00 +0530
categories: [CPTS, Web]
tags: ["WEB"]
description: Assess XML parsing, DTD processing and external resource restrictions.
permalink: "/posts/cpts-web-xxe/"
toc: true
---

Assess XML parsing, DTD processing and external resource restrictions.

> Use this methodology only for systems and test identities within an explicitly authorized assessment. Validate the minimum necessary impact and preserve sanitized evidence.
{: .tip }

## Decision tree

```text
XML-bearing request
  |-- Not XML -> identify actual parser
  |-- Internal entity expands -> examine external resolution configuration
  |-- DTD rejected -> confirm alternate parser entry points
  `-- No output -> inspect authorized logs and instrumentation
       -> Record observed parser boundary
```

## Step 1 — Confirm XML processing

Send a harmless valid XML fixture to the authorized endpoint and compare its normal response with a malformed fixture. Preserve the real method and content type.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<email><body>assessment-marker</body></email>
```

### Step 2 — Distinguish XML features from external resolution

An internal entity is a useful local parser exercise:

```xml
<?xml version="1.0"?>
<!DOCTYPE email [<!ENTITY marker "assessment-marker">]>
<email><body>&marker;</body></email>
```

Expansion of an internal entity does not prove external entities are enabled. Verify parser configuration, DTD handling, external entity resolution and network/file access in a controlled environment. An approved fixture, not a system secret, is the appropriate proof of unintended access.

| Observation | Next check |
|---|---|
| XML parse error | Confirm well-formed input and expected schema |
| Internal entity expands | Check whether external resolution is disabled |
| DTD blocked | Verify all parser entry points use the same policy |
| No entity output | Review logs and instrumented parser behavior; absence of output is not proof of safety |
| Uploaded document contains XML | Identify the actual processing library and its configuration |

The original notes cover CDATA, parameter entities, remote DTDs and blind out-of-band exfiltration. These are distinct parser behaviors, but the public guide does not reproduce external file extraction or exfiltration payloads.

**Study-note basis:** Intro to XXE, Advanced File Disclosure, Blind Data Exfiltration, XXE Prevention.

## Assessment workflow

### 1. Find XML consumers

Identify XML APIs, import features and file formats parsed as XML. Record the parser, runtime and normal request format where available.

### 2. Inspect parser configuration

Determine whether DTDs, external general entities, parameter entities and external schemas are permitted. Compare behavior with a harmless approved fixture and administrator-provided logs.

### 3. Distinguish response and blind behavior

A parser can resolve external resources even if the response does not display the result. Review outbound network policy and parser telemetry in an isolated, instrumented environment.

### 4. Validate and remediate

Disable external entity and unnecessary DTD processing, use secure parser settings and restrict outbound access. Assess resource limits without conducting denial-of-service tests.

## Decision checklist

| If you observe | Then check | Next action |
| --- | --- | --- |
| Endpoint accepts XML | Confirm which parser handles it. | Review parser features and trust boundaries. |
| External resolution is enabled | Document the configured resource access. | Review outbound and filesystem restrictions with approved evidence. |
| Response is silent | Check parser logs rather than assuming safety. | Assess blind behavior within an instrumented lab. |
| DTD input is rejected | Review other XML entry points. | Confirm secure configuration is consistent. |

## Common mistakes and missed checks

- Assuming JSON endpoints never accept XML.
- Relying only on response content.
- Confusing XML syntax errors with successful entity resolution.

## When to stop and reassess

Do not retrieve real files, initiate unapproved callbacks or run entity-expansion stress tests.

## Expected deliverable

Parser configuration, affected endpoint, controlled evidence and secure parser settings.

## Related methodology

- [Complete penetration testing methodology]({{ '/posts/cpts-methodology/' | relative_url }})
- [Phase 05 — Web Application Vulnerability Assessment]({{ '/posts/cpts-phase-05-web-vulnerabilities/' | relative_url }})

## Study basis

Adapted from CPTS study topics: Web Attacks: Intro to XXE, Advanced File Disclosure, Blind Data Exfiltration and Prevention. The sequencing and validation criteria are an editorial synthesis for a public assessment reference.
