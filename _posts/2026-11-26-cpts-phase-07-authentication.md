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

## Decision tree

```text
Authentication evidence
  |-- Unknown type -> identify source and protocol
  |-- Policy unknown -> establish restrictions before testing
  |-- Approved test account -> confirm identity and authorization separately
  `-- Exposure confirmed -> record location and impact without disclosing secrets
```

## Credential assessment workflow

1. Establish whether the material is a plaintext secret, password hash, challenge-response value, certificate or ticket. They are not interchangeable.
2. Determine the expected authentication protocol and account context: local, domain or application.
3. Confirm account policy and approved test budget before performing authentication checks.
4. Compare intended access with observed access using supplied test identities.

### Understand hashing with synthetic data

```bash
echo -n 'assessment-sample' | sha256sum
echo -n 'assessment-sample' | md5sum
```

These are illustrative digest operations from the hashing notes, not recommendations for storing passwords. Salts make identical passwords produce different stored values; encoding is reversible and is not hashing.

### Policy checks

```cmd
net accounts
net accounts /domain
```

Record threshold, observation window, duration and the permitted test-account budget. If the policy is unknown, do not begin repeated authentication attempts.

| Observation | Check next |
|---|---|
| Hash format unknown | Identify originating application and algorithm; do not infer solely from length |
| Same password used by two issued test accounts | Document policy or provisioning weakness; do not expand to unrelated accounts |
| Domain login works, service denies access | Check resource authorization and required authentication mechanism |
| Service account identified | Determine purpose, privilege and rotation policy |
| Sensitive value in configuration | Record location and exposure without copying the value into public notes |

The source chapters cover Hashcat, John, protected archives, Windows and Linux credential storage, and pass-the-hash/ticket/certificate concepts. For a public methodology, distinguish these mechanisms and document their prerequisites and defensive controls; credential extraction, cracking campaigns and reuse procedures are not reproduced here.

**Study-note basis:** Password Attacks, Hashcat, John The Ripper, Windows/Linux Authentication process, and AD password-policy notes.

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
