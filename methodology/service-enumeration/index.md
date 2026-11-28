---
layout: page
title: "Service-Specific Enumeration"
subtitle: "Methodology and per-service reference for enumerating network services"
permalink: /methodology/service-enumeration/
---

## Purpose

This section describes how to enumerate the network services most often found on internal and external targets. Each service page follows the same flow: identify the service, review its default and risky configuration, interact with it to confirm what it exposes, and record the decision points that determine the next step. Service enumeration is where most attack paths become visible, so the goal is to understand what a service reveals, why it is configured that way, and what that means for access.

## Enumeration methodology

Enumeration falls into three types: infrastructure-based enumeration (internet presence and gateways), host-based enumeration (the services running on a host) and OS-based enumeration (processes, privileges and system setup). Work through the layers in order, but return to earlier layers whenever new information changes the picture.

| Layer | Focus | Typical outputs |
| --- | --- | --- |
| 1. Internet presence | External footprint | Domains, subdomains, vhosts, ASNs, IP addresses, cloud instances |
| 2. Gateway | Security controls | Firewalls, DMZ, IDS/IPS, EDR, proxies, VPN |
| 3. Accessible services | Interfaces and services | Service type, configuration, port, version |
| 4. Processes | Internal processes | PID, data processed, tasks, sources and destinations |
| 5. Privileges | Permissions | Groups, users, permissions |
| 6. OS setup | System configuration | OS type, patch level, network configuration, config files |

Three principles apply throughout:

1. There is more than meets the eye. Consider all points of view.
2. Distinguish between what is visible and what is not.
3. There are always ways to gain more information. Understand the target.

> Treat every service as a source of configuration data as well as a potential entry point. Version banners, default settings and error messages often narrow the next step more than any single exploit.
{: .tip }

The full model, with the guiding questions and a note template, is on the [Enumeration Methodology](/methodology/service-enumeration/enumeration-methodology/) page.

## Common ports and services

| Port | Protocol | Service | Reference page |
| --- | --- | --- | --- |
| 21 (TCP), 20 (TCP data) | FTP | File transfer | [FTP and TFTP](/methodology/service-enumeration/ftp/) |
| 69 (UDP) | TFTP | Trivial file transfer | [FTP and TFTP](/methodology/service-enumeration/ftp/) |
| 22 (TCP) | SSH | Remote shell | [Linux Remote Management](/methodology/service-enumeration/remote-management-linux/) |
| 25, 587 (TCP) | SMTP | Mail transfer and submission | [SMTP](/methodology/service-enumeration/smtp/) |
| 53 (TCP and UDP) | DNS | Name resolution and zone data | [DNS](/methodology/service-enumeration/dns/) |
| 110, 995 (TCP) | POP3 | Mail retrieval | [IMAP and POP3](/methodology/service-enumeration/imap-pop3/) |
| 143, 993 (TCP) | IMAP | Mailbox access | [IMAP and POP3](/methodology/service-enumeration/imap-pop3/) |
| 111, 2049 (TCP and UDP) | NFS | Network file shares | [NFS](/methodology/service-enumeration/nfs/) |
| 139, 445 (TCP) | SMB | Shares and RPC | [SMB and Samba](/methodology/service-enumeration/smb/) |
| 161 (UDP) | SNMP | Device management | [SNMP](/methodology/service-enumeration/snmp/) |
| 623 (UDP) | IPMI | Out-of-band management | [IPMI](/methodology/service-enumeration/ipmi/) |
| 512 to 514 (TCP) | r-services | Legacy remote commands | [Linux Remote Management](/methodology/service-enumeration/remote-management-linux/) |
| 873 (TCP) | rsync | File synchronisation | [Linux Remote Management](/methodology/service-enumeration/remote-management-linux/) |
| 1433 (TCP) | MSSQL | Database | [Microsoft SQL Server](/methodology/service-enumeration/mssql/) |
| 1521 (TCP) | Oracle TNS | Database listener | [Oracle TNS Listener](/methodology/service-enumeration/oracle-tns/) |
| 3306 (TCP) | MySQL | Database | [MySQL](/methodology/service-enumeration/mysql/) |
| 3389 (TCP) | RDP | Remote desktop | [Windows Remote Management](/methodology/service-enumeration/remote-management-windows/) |
| 5985, 5986 (TCP) | WinRM | Remote management | [Windows Remote Management](/methodology/service-enumeration/remote-management-windows/) |
| 135 (TCP) plus dynamic RPC ports | WMI | Management instrumentation | [Windows Remote Management](/methodology/service-enumeration/remote-management-windows/) |

## Checklist

- ☐ Confirm scope and the rules of engagement for each service before interacting with it.
- ☐ Run a version-detecting scan and the relevant NSE scripts for every open port.
- ☐ Record the banner, version and any TLS certificate details for each service.
- ☐ Test for anonymous or null access before attempting any credentials.
- ☐ Review default and dangerous configuration settings where host access exists.
- ☐ Check for default, reused or weak credentials, respecting lockout thresholds.
- ☐ Identify what each service exposes: data, users, hosts, versions and trust relationships.
- ☐ Note every decision point and the next step it opens, with the evidence behind it.
- ☐ Record what cannot be seen and why, and decide whether a different vantage point is needed.

## Service pages

**Methodology**

- [Enumeration Methodology](/methodology/service-enumeration/enumeration-methodology/)

**Network and name services**

- [DNS](/methodology/service-enumeration/dns/)
- [SMB and Samba](/methodology/service-enumeration/smb/)
- [NFS](/methodology/service-enumeration/nfs/)
- [SNMP](/methodology/service-enumeration/snmp/)
- [IPMI](/methodology/service-enumeration/ipmi/)

**Mail services**

- [SMTP](/methodology/service-enumeration/smtp/)
- [IMAP and POP3](/methodology/service-enumeration/imap-pop3/)

**File transfer**

- [FTP and TFTP](/methodology/service-enumeration/ftp/)

**Databases**

- [MySQL](/methodology/service-enumeration/mysql/)
- [Microsoft SQL Server](/methodology/service-enumeration/mssql/)
- [Oracle TNS Listener](/methodology/service-enumeration/oracle-tns/)

**Remote management**

- [Linux Remote Management](/methodology/service-enumeration/remote-management-linux/)
- [Windows Remote Management](/methodology/service-enumeration/remote-management-windows/)
