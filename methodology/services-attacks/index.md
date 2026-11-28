---
layout: page
title: "Services Attacks"
subtitle: "Section index: attacking common network services during an assessment"
permalink: /methodology/services-attacks/
---

This section covers attacks against network services that are frequently exposed in internal and external environments: Windows file sharing (SMB), remote desktop (RDP), file transfer (FTP), name resolution (DNS), mail (SMTP, POP3, IMAP) and databases (MSSQL, MySQL). Every page follows the same flow: identify the service, enumerate its configuration, test for anonymous access and misconfigurations, attack authentication carefully, and then apply protocol-specific techniques. The attack concept page provides the vocabulary (source, process, privileges, destination) used to reason about any service.

## Checklist

☐ Identify the version and banner of every service on the in-scope hosts
☐ Test anonymous and null-session access before attempting any credential attack
☐ Enumerate the shares, users, mail routes, zones and databases that are reachable
☐ Read the password policy and lockout threshold before any password spraying
☐ Record every credential, hash and accessible share in the engagement notes
☐ Use the prevention page to build remediation recommendations for the report

## Pages in this section

- [Attack concept](/methodology/services-attacks/attack-concept/)
- [SMB attacks](/methodology/services-attacks/smb-attacks/)
- [RDP attacks](/methodology/services-attacks/rdp-attacks/)
- [FTP attacks](/methodology/services-attacks/ftp-attacks/)
- [DNS attacks](/methodology/services-attacks/dns-attacks/)
- [Email attacks](/methodology/services-attacks/email-attacks/)
- [Database attacks](/methodology/services-attacks/database-attacks/)
- [Services prevention](/methodology/services-attacks/prevention/)
