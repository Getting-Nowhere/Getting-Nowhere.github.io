---
title: "Phase 03 — Service Enumeration and Infrastructure Assessment"
date: 2026-11-26 17:57:00 +0530
categories: [CPTS, Enumeration]
tags: ["ENUMERATION"]
description: Investigate each discovered protocol and establish its authentication and authorization boundaries.
permalink: "/posts/cpts-phase-03-services/"
toc: true
---

Investigate each discovered protocol and establish its authentication and authorization boundaries.

> Use this methodology only for systems and test identities within an explicitly authorized assessment. Validate the minimum necessary impact and preserve sanitized evidence.
{: .tip }

## Assessment workflow

### 1. Establish a service baseline

For each endpoint record the protocol, port, product, authentication methods, transport security and advertised capabilities. Confirm whether the service is intentionally exposed.

### 2. Review unauthenticated behavior

Determine whether public or guest access is explicitly supported. Use read-only queries within scope and record what an unauthenticated client can observe. Do not assume anonymous access is a vulnerability without checking the intended policy.

### 3. Review authorized account access

With supplied test identities, compare the services and data each role can access. Distinguish a successful connection from permission to read, write or administer the resource.

### 4. Validate configuration and version findings

Compare observed configuration against the expected deployment. Check vendor advisories for exact versions, enabled modules, platform dependencies and patches. Prioritize confirmed misconfiguration over a speculative CVE.

## Decision checklist

| If you observe | Then check | Next action |
| --- | --- | --- |
| DNS (53) | Review authoritative records, record types and zone-transfer policy. | Correlate hostnames with the asset inventory; distinguish recursive and authoritative roles. |
| FTP (21), SMB (139/445), NFS (2049) | Review authentication, share/export configuration and permitted read/write operations. | Check whether sample files and intended permissions match the access model. |
| SMTP (25/587), IMAP (143/993), POP3 (110/995) | Review transport security, relay policy and authentication requirements. | Use approved test mailboxes and recipients; avoid sending unsolicited messages. |
| SNMP (161/UDP), IPMI (623/UDP) | Identify protocol/version and access restrictions. | Confirm whether management information is appropriately restricted. |
| MySQL (3306), MSSQL (1433), Oracle TNS (1521) | Review listener exposure, authentication and database roles. | Use test data and non-mutating queries; assess separation of application and administrative roles. |
| SSH (22), RDP (3389), WinRM (5985/5986) | Review allowed identities, authentication settings and network restrictions. | Validate intended login with an approved account; check role separately. |
| LDAP (389/636), RPC (135), Kerberos (88) | Identify directory naming context and supported authentication. | Phase 11 for directory-specific permissions. |

## Read-only reference commands

Examples use an approved environment. Replace placeholders with authorized lab values. Commands are reference examples, not an instruction to run them against arbitrary hosts.

```bash
# HTTP response headers
curl -I https://app.example.test/

# DNS records using an approved resolver
dig @<DNS_SERVER> app.example.test A

# Read-only LDAP naming context discovery
ldapsearch -x -H ldap://<LAB_DC> -s base -b "" defaultNamingContext
```

## Common mistakes and missed checks

- Treating management interfaces as ordinary application endpoints.
- Checking a file share once without considering role-specific permissions.
- Ignoring service exposure on non-default ports or additional interfaces.

## When to stop and reassess

Do not retrieve sensitive material or modify remote state simply to strengthen an exposure finding.

## Expected deliverable

A protocol-specific evidence record for each in-scope service, with prioritized configuration and access findings.

## Related methodology

- [Complete penetration testing methodology]({{ '/posts/cpts-methodology/' | relative_url }})
- [Phase 04 — Web Discovery, Fuzzing and Request Analysis]({{ '/posts/cpts-phase-04-web-discovery/' | relative_url }})
- [Phase 07 — Credentials, Authentication and Access Assessment]({{ '/posts/cpts-phase-07-authentication/' | relative_url }})
- [Phase 11 — Active Directory Assessment]({{ '/posts/cpts-phase-11-active-directory/' | relative_url }})

## Study basis

Adapted from CPTS study topics: Footprinting: Host-based Enumeration and Remote Management; Attacking Common Services. The sequencing and validation criteria are an editorial synthesis for a public assessment reference.
