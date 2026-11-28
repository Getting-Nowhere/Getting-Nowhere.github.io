---
layout: page
title: "Penetration Testing Methodology"
subtitle: "A phase-by-phase workflow from first contact to domain compromise, built from my CPTS study notes."
permalink: /methodology/
---

This is the master workflow I follow on an engagement. Each phase links to a detailed section with commands, decision points and defensive notes. Work through the phases in order, but loop back whenever a new finding changes the picture: a credential found during web testing often unlocks a service that was previously out of reach.

## Phase overview

| # | Phase | Goal | Section |
| --- | --- | --- | --- |
| 1 | External reconnaissance | Map the attack surface without touching the target directly | [Recon](/methodology/recon/) |
| 2 | Network scanning and host discovery | Find live hosts, open ports and running services | [Network scanning](/methodology/network-scanning/) |
| 3 | Service-specific enumeration | Enumerate each exposed service in depth | [Service enumeration](/methodology/service-enumeration/) |
| 4 | Web application testing | Find and validate input-handling and logic flaws | [Web application](/methodology/web-app/) |
| 5 | Web attacks and common applications | Test IDOR, XXE, verb tampering and known platforms | [Web attacks](/methodology/web-attacks/), [Common apps](/methodology/common-apps/) |
| 6 | Attacking common services | Attack exposed services such as SMB, RDP, FTP and databases | [Services attacks](/methodology/services-attacks/) |
| 7 | Password attacks | Obtain credentials through spraying, cracking and hunting | [Passwords](/methodology/passwords/) |
| 8 | Initial access and shells | Gain a foothold and stabilise a shell | [Shells and transfers](/methodology/shells-and-transfers/) |
| 9 | Privilege escalation | Move from a low-privilege user to root or SYSTEM | [Linux](/methodology/privesc-linux/), [Windows](/methodology/privesc-windows/) |
| 10 | Lateral movement and pivoting | Reach further hosts and networks | [Lateral movement](/methodology/lateral-movement/), [Pivoting](/methodology/pivoting/) |
| 11 | Active Directory | Enumerate and abuse the domain | [Active Directory](/methodology/active-directory/) |

## Decision flow

```text
Scope confirmed
  └── Recon (passive first)
        └── Scan hosts and ports
              ├── Web service?      -> Web app -> Web attacks / Common apps
              ├── Network service?  -> Service enumeration -> Service attacks
              └── Any credentials?  -> Password attacks (spraying, cracking, hunting)
                    └── Foothold gained?
                          ├── Escalate locally (Linux / Windows)
                          ├── Hunt for pivot points (new interfaces, internal subnets)
                          │     └── Pivot / tunnel -> repeat scan from the new network
                          └── Domain present?   -> Active Directory attack path
                                └── Domain admin / DCSync -> loot and document
```

## Golden rules

1. Enumerate before exploiting. Most failed attacks came from an incomplete picture of the target.
2. Write everything down as you go: commands, outputs, credentials and timestamps. Notes are how you rebuild the attack path later.
3. Save scan output in multiple formats, for example `nmap -oA`, so nothing is lost if a tool crashes.
4. Prefer the quiet option. Passive recon and targeted checks beat blind brute force on a live system.
5. Retest a credential or service that failed earlier after new information arrives.
6. Check every finding for a defensive fix as well as an exploit path. The defensive notes on each page are what a report needs.
7. Before a new technique, confirm it is in scope and that the rules of engagement allow it.

## Quick reference: which section to open

| If you see... | Start here |
| --- | --- |
| A new domain or subdomain | [Recon](/methodology/recon/) and [vhost discovery](/methodology/recon/vhost-discovery/) |
| Open ports you do not recognise | [Network scanning](/methodology/network-scanning/) |
| SMB, NFS, SNMP, FTP, DNS or a database | [Service enumeration](/methodology/service-enumeration/) |
| A login page or an input field | [Web app](/methodology/web-app/) and [Login brute forcing](/methodology/web-app/login-brute-forcing/) |
| A known platform such as WordPress, Tomcat or Jenkins | [Common apps](/methodology/common-apps/) |
| A hash or an encrypted file | [Passwords](/methodology/passwords/) |
| A low-privilege shell | [Linux privesc](/methodology/privesc-linux/) or [Windows privesc](/methodology/privesc-windows/) |
| A second network segment | [Pivoting](/methodology/pivoting/) |
| A domain controller or AD credentials | [Active Directory](/methodology/active-directory/) and [Lateral movement](/methodology/lateral-movement/) |

## Starting checklist

- ☐ Scope and rules of engagement confirmed in writing
- ☐ Passive recon complete (DNS, certificates, OSINT, cloud storage)
- ☐ Full TCP and targeted UDP scans saved to disk
- ☐ Every open service enumerated, not only the web ports
- ☐ Default and weak credentials checked on every login surface
- ☐ Every credential found tested against every service
- ☐ Local privilege escalation checklist run after each new shell
- ☐ Internal network and domain checked for pivot points and AD exposure
- ☐ Findings, evidence and defensive fixes recorded as you go
