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

## Decision tree

```text
Listening port
  |-- Protocol uncertain -> fingerprint before choosing a test
  |-- Unauthenticated visibility -> compare expected public access
  |-- Authentication required -> use supplied test role
  `-- Access confirmed -> distinguish read, write and management permissions
       |-- Unexpected permission -> validate and record
       `-- Expected permission -> next service
```

## Protocol-specific field checks

### SMB — start with share visibility

```bash
smbclient -N -L //TARGET_IP
smbclient -L //TARGET_IP -U TEST_USER
rpcclient -N -U "" TARGET_IP
```

Inside an authorized RPC session, `querydominfo` establishes domain context. A successful share listing does not establish read or write permission. Compare share access and underlying filesystem ACLs using an approved test identity. If the service is a domain member, continue to the AD page.

### FTP — identify authentication and transport

```bash
openssl s_client -connect TARGET_IP:21 -starttls ftp
```

If anonymous access is offered, verify its intended scope; distinguish list, read and write rights. If an account is required, use the issued test account. A banner alone does not establish a vulnerable FTP deployment.

### DNS — identify authoritative infrastructure

```bash
dig NS DOMAIN @DNS_IP
dig MX DOMAIN @DNS_IP
dig SOA DOMAIN @DNS_IP
```

If the server is authoritative, distinguish recursive resolution from authoritative responses. Record delegated zones and confirm newly discovered names are in scope. Review whether zone transfers are restricted through approved configuration checks.

### NFS — correlate exports and permissions

On an authorized server, review the original configuration:

```bash
cat /etc/exports
```

Check permitted clients, read/write mode, and root-squash settings. A mounted export does not by itself demonstrate unintended privilege.

### SMTP, POP3 and IMAP

```bash
telnet TARGET_IP 25
```

Within the SMTP session use `EHLO assessment.example` and `QUIT` to inspect advertised capabilities. Check STARTTLS and authentication requirements; do not send mail to unrelated recipients. On an approved mail server review `/etc/postfix/main.cf` and compare the relay policy with documented intent.

### Databases

```bash
sudo nmap -sV -p 3306,1433,1521 TARGET_IP
mysql -h TARGET_IP -u TEST_USER -p
```

After login, use the authorized database and inspect permissions rather than assuming a database login is a host administrator. Distinguish server roles from individual database roles and record intended access.

### SNMP and management services

If UDP/161 or UDP/623 is observed, establish management protocol and version. On an approved SNMP server, inspect `/etc/snmp/snmpd.conf` without publishing community strings. Check whether access is restricted to management networks. Treat IPMI and database management endpoints as privileged boundaries.

| If found | Check next | Avoid |
|---|---|---|
| Readable SMB share | Intended audience, data classification, ACLs | Equating a readable share with unrestricted host access |
| NFS export | Client restrictions, root mapping, file ownership | Writing to production exports |
| Database listener | Authentication, permitted schema and role | Assuming a version match is proof |
| SMTP capability | TLS, relay restrictions, intended users | Sending unsolicited mail |
| Management endpoint | Source network, protocol and access policy | Broad high-impact scripts |

**Study-note basis:** Footprinting host-based protocol notes and Attacking Common Services.

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
