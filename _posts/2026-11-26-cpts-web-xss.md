---
title: "Web Assessment — Cross-Site Scripting (XSS)"
date: 2026-11-26 17:54:00 +0530
categories: [CPTS, Web]
tags: ["WEB"]
description: Distinguish reflected, stored, DOM-based and blind XSS; assess execution contexts and browser trust boundaries.
permalink: "/posts/cpts-web-xss/"
toc: true
---

Distinguish reflected, stored, DOM-based and blind XSS; assess execution contexts and browser trust boundaries.

> Use this methodology only for systems and test identities within an explicitly authorized assessment. Validate the minimum necessary impact and preserve sanitized evidence.
{: .tip }

## Assessment workflow

### 1. Trace the input

Identify URL parameters, form fields, profile data and client-side values that reach a rendered page. Submit a unique inert marker and inspect both the HTTP response and the live DOM.

### 2. Classify the behavior

Reflected XSS concerns input returned in the current response; stored XSS concerns persisted input rendered later; DOM XSS concerns client-side processing of untrusted data. Blind XSS is a visibility condition, typically involving a different authorized viewer or administrative interface.

### 3. Identify the output context

Determine whether the marker appears in text, an HTML attribute, a script string, a URL or a DOM sink. Check whether encoding is appropriate for that specific context. Review source-to-sink data flow where code is available.

### 4. Assess impact without involving real users

Use an isolated browser and controlled test accounts. Document execution potential, affected origin, persistence, affected roles and whether browser controls limit the impact. Treat defacement, deceptive interfaces and session compromise as possible consequences, not necessary proof steps.

### 5. Verify remediation

Require context-specific encoding, safe DOM APIs and appropriate sanitization for permitted rich HTML. Treat CSP and cookie attributes as defense in depth, not substitutes for safe rendering.

## Decision checklist

| If you observe | Then check | Next action |
| --- | --- | --- |
| Marker is present in the immediate server response | Inspect the surrounding response context. | Reflected behavior; distinguish text reflection from script execution. |
| Marker reappears after refresh or another test login | Locate the storage and every rendering view. | Stored behavior; assess affected authorized roles. |
| Marker is absent from the raw response but present in DOM | Trace client-side source and sink using developer tools. | DOM behavior; inspect client-side rendering. |
| Only a designated reviewer sees the input | Use an approved reviewer account and controlled evidence. | Blind exposure; do not contact unrelated users or collect session data. |
| Encoding appears to prevent execution | Compare the encoding with the actual rendering context. | Record the control; do not assume every sink is protected. |

## Common mistakes and missed checks

- Testing only the visible search field rather than every relevant render path.
- Confusing reflection with executable script.
- Ignoring stored content shown to a different role or client-side rendering.

## When to stop and reassess

If the input is consistently treated as data in the tested contexts, record the coverage and park the lead.

## Expected deliverable

Input, output context, affected roles, persistence, observed behavior and recommended rendering control.

## Related methodology

- [Complete penetration testing methodology]({{ '/posts/cpts-methodology/' | relative_url }})
- [Phase 05 — Web Application Vulnerability Assessment]({{ '/posts/cpts-phase-05-web-vulnerabilities/' | relative_url }})

## Study basis

Adapted from CPTS study topics: Cross Site Scripting: XSS Basics, Discovery, Attacks and Prevention. The sequencing and validation criteria are an editorial synthesis for a public assessment reference.
