---
title: "Phase 07 — Credentials, Authentication and Access Assessment"
date: 2026-11-26 17:43:00 +0530
categories: [CPTS, Authentication]
tags: ["ENUMERATION"]
description: Review account protections, credential-handling practices and the scope of approved test identities.
permalink: "/posts/cpts-phase-07-authentication/"
toc: true
---

Review account protections, credential-handling practices and the scope of approved test identities.

> Use this methodology only for systems and test identities within an explicitly authorized assessment. Validate the minimum necessary impact and preserve sanitized evidence.
{: .tip }

## Assessment workflow

### 1. Establish identity context

Distinguish local, domain, application and service accounts. Record the intended authentication mechanism and services each supplied test identity is authorized to use.

### 2. Review policy before testing

Obtain password length/complexity policy, lockout threshold, observation window, throttling and MFA configuration. Use a separate written budget for any online attempt-based assessment.

### 3. Assess exposure categories

Review whether configuration files, histories, network shares, protected archives or logs contain inappropriate credential material using approved synthetic evidence or owner-provided samples. Distinguish plaintext, hashes, encrypted files and authentication tokens.

### 4. Assess password resilience safely

Review dictionary, hybrid, brute-force and spraying threat models as separate risks. Where offline password-strength testing is authorized, use supplied synthetic or explicitly approved test hashes and handle all results as sensitive evidence.

### 5. Review authentication boundaries

Assess whether NTLM, Kerberos and certificate-based authentication have appropriate policies. Evaluate credential reuse and delegation risk through identity configuration and approved test accounts; do not extract or replay production credentials.

### 6. Handle evidence securely

Store secrets only in the approved encrypted evidence location, never in public reports or repository content. Revoke or rotate any test secrets on completion.

## Decision checklist

| If you observe | Then check | Next action |
| --- | --- | --- |
| A login request behaves differently for valid and invalid test identities | Confirm the expected role and response behavior. | Check enumeration resistance and session creation. |
| A configuration or share contains a potential secret | Confirm classification and intended permissions without copying unnecessary contents. | Notify owner and document rotation and access control. |
| A hash or protected archive is provided for testing | Identify format and written scope. | Use offline, isolated test data only. |
| A policy allows weak account protection | Review actual configuration and audit logs. | Recommend MFA, monitoring and account-safe throttling. |
| A test identity accesses a service | Confirm actual authorization separately from authentication. | Repeat relevant service or application inventory. |

## Common mistakes and missed checks

- Confusing password hashes with challenge-response values, tickets or certificates.
- Assuming access to one service establishes access to every service.
- Leaving credentials in command history, logs or public documentation.

## When to stop and reassess

Stop on unexpected lockouts, real secret exposure, unapproved identity access or exhaustion of the attempt budget.

## Expected deliverable

An identity and authentication matrix, documented exposure classes, policy findings and secure evidence handling.

## Related methodology

- [Complete penetration testing methodology]({{ '/posts/cpts-methodology/' | relative_url }})
- [Phase 08 — Authorized Host Access and Session Assessment]({{ '/posts/cpts-phase-08-host-access/' | relative_url }})
- [Phase 11 — Active Directory Assessment]({{ '/posts/cpts-phase-11-active-directory/' | relative_url }})

## Study basis

Adapted from CPTS study topics: Password Attacks; Login Brute Forcing; Common Services; AD Password Policy. The sequencing and validation criteria are an editorial synthesis for a public assessment reference.
