---
title: "Phase 11 — Active Directory Assessment"
date: 2026-11-26 17:39:00 +0530
categories: [CPTS, Active Directory]
tags: ["ENUMERATION", "PRIVILEGE ESCALATION"]
description: Map directory structure, authentication, accounts, delegated rights, GPOs and trust boundaries.
permalink: "/posts/cpts-phase-11-active-directory/"
toc: true
---

Map directory structure, authentication, accounts, delegated rights, GPOs and trust boundaries.

> Use this methodology only for systems and test identities within an explicitly authorized assessment. Validate the minimum necessary impact and preserve sanitized evidence.
{: .tip }

## Assessment workflow

### 1. Understand the directory structure

Identify domains, forests, domain controllers, organizational units, users, groups and computer objects. Record DNS naming, LDAP naming context and trust relationships. Distinguish a domain account from a local account.

### 2. Establish unauthenticated and credentialed baselines

Review exposed SMB, LDAP, RPC and Kerberos services. Use approved directory accounts for user/group/computer inventory and compare the available metadata and permissions. Review password policy before any identity testing.

### 3. Review identity and service-account exposure

Inspect SPN-bearing accounts, Kerberos pre-authentication settings, legacy NTLM and fallback name-resolution configuration, privileged group membership and service-account policy. Explain Kerberoasting, AS-REP roasting and name-resolution poisoning as risks associated with configuration, without collecting tickets or credentials.

### 4. Assess effective access relationships

Review nested groups, delegated ACLs, GPO links and permissions, local administrator assignment, RDP/WinRM/SQL access and directory replication rights. Graph collection and tools such as BloodHound can support analysis when authorized; validate graph edges against effective permissions.

### 5. Review cross-domain boundaries

Map trust direction, transitivity, filtering and foreign group membership. Review delegation and the Kerberos double-hop limitation. Verify the applicable patch and service configuration for NoPac, PrintNightmare and PetitPotam-related exposure.

### 6. Report the relationship, not a speculative chain

For each concern record the principal, target object, effective permission, scope of impact and intended delegation. Review whether controls and monitoring address the risk. Re-evaluate approved test identities when access changes.

## Decision checklist

| If you observe | Then check | Next action |
| --- | --- | --- |
| SPN or pre-authentication exception is present | Review service-account configuration and policy. | Assess password and encryption policy; do not extract ticket material. |
| Interesting ACL is present | Resolve SID, object type, inheritance and effective rights. | Determine whether the delegation is necessary. |
| Writable GPO is suspected | Review edit permissions, links, filtering and affected OUs. | Document effective policy scope without changing it. |
| Replication rights are assigned | Review exact rights and principal with the directory administrator. | Assess DCSync exposure without extracting directory secrets. |
| Trust relationship exists | Identify type, direction, filtering and expected access. | Check cross-domain authorization and documentation. |
| Remote logon group membership is found | Verify intended membership and host/service scope. | Separate authentication from administrative authorization. |

## Read-only reference commands

Examples use an approved environment. Replace placeholders with authorized lab values. Commands are reference examples, not an instruction to run them against arbitrary hosts.

```powershell
# Run with an approved account and the AD PowerShell module
Get-ADDomain
Get-ADForest
Get-ADDomainController -Filter *
Get-ADDefaultDomainPasswordPolicy
Get-ADGroupMember "Domain Admins" -Recursive
Get-ADTrust -Filter *
```

## Common mistakes and missed checks

- Ignoring nested groups, inherited ACLs and GPO filtering.
- Assuming a graph edge proves a working escalation path.
- Confusing domain-level rights with host-local access.
- Overlooking controls on legacy authentication and fallback name resolution.

## When to stop and reassess

Do not perform credential capture, ticket manipulation, replication extraction or directory modifications as part of this public methodology.

## Expected deliverable

Domain topology, identity/group inventory, validated delegation concerns, trust assessment and remediation priorities.

## Related methodology

- [Complete penetration testing methodology]({{ '/posts/cpts-methodology/' | relative_url }})
- [Phase 12 — Network Segmentation and Lateral Access Assessment]({{ '/posts/cpts-phase-12-network-boundaries/' | relative_url }})
- [Phase 13 — Validation, Reporting and Closeout]({{ '/posts/cpts-phase-13-reporting/' | relative_url }})

## Study basis

Adapted from CPTS study topics: Fundamentals of Active Directory; Active Directory Enumeration and Attacks; Credentialed Enumeration; ACLs; Trusts. The sequencing and validation criteria are an editorial synthesis for a public assessment reference.
