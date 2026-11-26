---
title: "Penetration Testing Methodology: From Reconnaissance to Reporting"
date: 2026-11-26 18:00:00 +0530
categories: [CPTS, Methodology]
tags: [pentesting, methodology, reconnaissance, enumeration, cpts]
description: A comprehensive penetration testing methodology covering reconnaissance, service enumeration, web applications, privilege escalation, Active Directory, pivoting and reporting.
toc: true
featured: true
badge: "METHODOLOGY"
---

> **Enumeration is the foundation of every successful penetration test.** Knowing what to look for, understanding why it matters, and deciding what to investigate next is far more valuable than memorizing commands.

This methodology is a structured reference developed from my CPTS study material. It covers the penetration testing lifecycle, from initial reconnaissance to final reporting, with an emphasis on enumeration, decision-making, commonly overlooked checks and prioritization.

Rather than treating penetration testing as a fixed sequence of commands, this methodology follows an iterative approach. Every new discovery provides additional context that may require revisiting an earlier phase.

All techniques discussed throughout this methodology are intended for authorized security assessments and controlled lab environments.

## Assessment Lifecycle

| Phase | Topic | Objective |
| ----- | ----- | --------- |
| 01 | Scope and Preparation | Establish assessment boundaries and objectives |
| 02 | Reconnaissance and Network Discovery | Identify assets, hosts and exposed services |
| 03 | Service Enumeration | Understand individual services and their security boundaries |
| 04 | Web Application Discovery | Identify applications, endpoints, parameters and technologies |
| 05 | Web Application Testing | Assess application-specific vulnerabilities |
| 06 | Common Enterprise Applications | Evaluate CMS platforms, development tools and enterprise software |
| 07 | Credentials and Authentication | Assess authentication mechanisms and account protections |
| 08 | Host Access | Understand the current host, identity and session |
| 09 | Linux Privilege Escalation | Identify insecure Linux privilege configurations |
| 10 | Windows Privilege Escalation | Identify insecure Windows privilege configurations |
| 11 | Active Directory | Enumerate domain identities, permissions and trust relationships |
| 12 | Pivoting and Network Segmentation | Understand internal networks and access boundaries |
| 13 | Validation and Reporting | Document findings, impact and remediation |

## Phase 01 — Scope and Preparation

Before interacting with any target, establish what is permitted and what the assessment is expected to achieve.

### Initial Checklist

- [ ] Identify all in-scope IP addresses and domains.
- [ ] Identify excluded systems and services.
- [ ] Understand the assessment objectives.
- [ ] Establish permitted testing techniques.
- [ ] Prepare the testing environment.
- [ ] Establish an evidence collection and documentation process.
- [ ] Identify restrictions on disruptive or high-impact testing.

### Organizing the Assessment

Maintain separate records for:

- Discovered hosts and services.
- Application endpoints.
- Authorized test accounts.
- Confirmed vulnerabilities.
- Potential vulnerabilities requiring verification.
- Failed attempts and inconclusive results.
- Network architecture and access boundaries.

> Document findings as they are discovered. Reconstructing an entire assessment after completing it is considerably more difficult.
{: .tip }

## Phase 02 — Reconnaissance and Network Discovery

The objective of reconnaissance is to understand the target environment before drawing conclusions about its security.

### What to Identify

- [ ] Live hosts.
- [ ] Open TCP and UDP ports.
- [ ] Service names and versions.
- [ ] Operating systems.
- [ ] Domains and subdomains.
- [ ] Virtual hosts.
- [ ] DNS records.
- [ ] Network infrastructure.
- [ ] Internet-facing applications.

### Initial Enumeration

```bash
nmap -sn TARGET_SUBNET
```

```bash
nmap -sV TARGET_IP
```

```bash
nmap -p- TARGET_IP
```

### Decision Matrix

| Observation | Next Step |
| ----------- | --------- |
| Web service discovered | Perform web application discovery |
| SMB discovered | Enumerate SMB configuration and shares |
| DNS discovered | Investigate domain and DNS records |
| LDAP discovered | Identify directory structure |
| Kerberos discovered | Investigate Active Directory context |
| Database discovered | Identify database type and authentication requirements |
| Unknown service discovered | Identify protocol and service behavior |
| Host discovery fails | Determine whether discovery probes are being filtered |

### Commonly Missed Checks

- Services running on non-standard ports.
- UDP services.
- Additional virtual hosts.
- Hostnames disclosed in TLS certificates.
- Redirects to previously unidentified domains.
- Hosts that do not respond to ICMP.

> An open port is an observation, not a vulnerability. Understand the service before attempting to assess its security.
{: .tip }

## Phase 03 — Service Enumeration

Once the initial service inventory is complete, investigate each discovered protocol individually.

### Service Reference

| Port | Service | Primary Areas of Investigation |
| ---- | ------- | ------------------------------ |
| 21 | FTP | Authentication, anonymous access, permissions |
| 22 | SSH | Version, authentication configuration |
| 25 | SMTP | Mail configuration and relay restrictions |
| 53 | DNS | Records, domain information |
| 69 | TFTP | Access restrictions and file exposure |
| 80/443 | HTTP/HTTPS | Web applications and virtual hosts |
| 88 | Kerberos | Domain authentication context |
| 111 | RPCBind | Registered RPC services |
| 135 | MSRPC | Windows RPC interfaces |
| 139/445 | SMB | Shares, permissions, signing |
| 161 | SNMP | Management information exposure |
| 389/636 | LDAP/LDAPS | Directory structure and access controls |
| 1433 | MSSQL | Authentication and database permissions |
| 2049 | NFS | Export configuration and permissions |
| 3306 | MySQL | Authentication and database configuration |
| 3389 | RDP | Remote access restrictions |
| 5432 | PostgreSQL | Database access and configuration |
| 5985/5986 | WinRM | Remote management permissions |

### Enumeration Principles

For every discovered service:

1. Identify the protocol and implementation.
2. Determine the authentication requirements.
3. Identify information available without authentication.
4. Review access granted to authorized test accounts.
5. Examine configuration and permission boundaries.
6. Record potential weaknesses and their prerequisites.
7. Validate observations before classifying them as findings.

## Phase 04 — Web Application Discovery

Before investigating individual vulnerabilities, understand how the application is structured and how it processes requests.

### Enumeration Checklist

- [ ] Identify application technologies.
- [ ] Identify frameworks and server software.
- [ ] Discover application directories and endpoints.
- [ ] Identify virtual hosts.
- [ ] Review HTTP headers.
- [ ] Inspect cookies and session behavior.
- [ ] Identify GET and POST parameters.
- [ ] Review JavaScript resources.
- [ ] Identify API endpoints.
- [ ] Identify authentication and registration functionality.
- [ ] Identify file upload and download functionality.
- [ ] Map application roles and access levels.

### Initial HTTP Inspection

```bash
curl -I https://TARGET
```

```bash
curl -i https://TARGET
```

```bash
curl https://TARGET/robots.txt
```

### Request Analysis

Use an intercepting proxy to understand:

- Request methods.
- URL parameters.
- Request bodies.
- Authentication headers.
- Session cookies.
- Content types.
- Response codes.
- Redirect behavior.
- Differences between authenticated and unauthenticated requests.

### Commonly Missed Checks

- Hidden functionality referenced by JavaScript.
- Parameters inside JSON request bodies.
- Alternative content types.
- Administrative endpoints.
- Old or deprecated application routes.
- Differences between user roles.
- Functionality available through APIs but not the user interface.

## Phase 05 — Web Application Testing

Choose the appropriate vulnerability assessment based on the functionality discovered during enumeration.

### Vulnerability Selection Matrix

| Observed Functionality | Vulnerability to Investigate |
| ---------------------- | ---------------------------- |
| User input rendered in a browser | Cross-Site Scripting |
| Database-driven search or filtering | SQL Injection |
| System-related functionality | OS Command Injection |
| Dynamic page or template selection | File Inclusion |
| User-controlled file paths | Path Traversal |
| File upload functionality | Unrestricted File Upload |
| User-controlled object identifiers | IDOR |
| XML request processing | XXE |
| HTTP method-dependent functionality | HTTP Verb Tampering |
| Login and password reset functionality | Authentication Weaknesses |
| Automatically mapped request properties | Mass Assignment |
| Directory-backed authentication | LDAP Injection |

### Dedicated Methodologies

Each vulnerability family has its own methodology covering discovery, prerequisites, validation, commonly missed checks and troubleshooting.

- [Cross-Site Scripting (XSS)]({{ '/posts/cpts-web-xss/' | relative_url }})
- [SQL Injection and SQLMap]({{ '/posts/cpts-web-sqli/' | relative_url }})
- [OS Command Injection]({{ '/posts/cpts-web-command-injection/' | relative_url }})
- [File Inclusion and Path Traversal]({{ '/posts/cpts-web-file-inclusion/' | relative_url }})
- [File Upload Vulnerabilities]({{ '/posts/cpts-web-file-upload/' | relative_url }})
- [Insecure Direct Object References]({{ '/posts/cpts-web-idor/' | relative_url }})
- [XML External Entity Injection]({{ '/posts/cpts-web-xxe/' | relative_url }})
- [HTTP Verb Tampering]({{ '/posts/cpts-web-verb-tampering/' | relative_url }})
- [Authentication and Account Protection]({{ '/posts/cpts-web-authentication/' | relative_url }})
- [LDAP Injection and Mass Assignment]({{ '/posts/cpts-web-additional/' | relative_url }})

> Select a testing methodology based on the functionality and behavior of the application, rather than testing every vulnerability against every parameter.
{: .tip }

## Phase 06 — Common Enterprise Applications

Identify recognizable applications and understand their architecture, deployment model and security configuration.

### Applications to Recognize

| Application | Areas of Investigation |
| ----------- | ---------------------- |
| WordPress | Core version, plugins, themes, user roles |
| Joomla | Extensions, templates, administration |
| Drupal | Modules, version, access control |
| GitLab | Repositories, visibility, permissions |
| Jenkins | Build configuration, credentials management, roles |
| Apache Tomcat | Manager interfaces, deployment permissions |
| ColdFusion | Version, administrative exposure |
| Splunk | Management interfaces, roles, application permissions |
| PRTG | Monitoring interfaces and access controls |
| osTicket | Ticket visibility, attachments, user permissions |

### Assessment Workflow

- [ ] Confirm the application identity.
- [ ] Determine its version.
- [ ] Identify installed extensions or components.
- [ ] Identify exposed administrative interfaces.
- [ ] Review authentication requirements.
- [ ] Review security advisories.
- [ ] Verify vulnerability prerequisites.
- [ ] Assess configuration and access controls.

Do not assume that identifying a vulnerable version proves exploitability. Configuration, backported patches and deployment conditions may change the actual exposure.

## Phase 07 — Credentials and Authentication

Authentication findings should be evaluated in the context of the entire environment.

### Checks

- [ ] Password policy.
- [ ] Account lockout policy.
- [ ] Multi-factor authentication.
- [ ] Default account configuration.
- [ ] Service account permissions.
- [ ] Password storage practices.
- [ ] Session management.
- [ ] Password reset functionality.
- [ ] Credential exposure in application configuration.
- [ ] Authorization differences between account types.

### Important Considerations

| Finding | What to Verify |
| ------- | -------------- |
| Weak password policy | Effective policy and compensating controls |
| Exposed credential | Validity, ownership and intended permissions |
| Service account | Required privileges and account restrictions |
| Authentication failure | Account status, protocol and authentication requirements |
| Successful authentication | Effective authorization and accessible resources |

Authentication confirms identity. It does not automatically establish administrative privileges.

## Phase 08 — Host Access and Enumeration

Once authorized host access is available, establish the current security context before proceeding with deeper system assessment.

### Linux

```bash
whoami
id
hostname
uname -a
cat /etc/os-release
ip addr
ip route
```

### Windows

```powershell
whoami
whoami /all
hostname
systeminfo
ipconfig /all
route print
```

### What to Establish

- [ ] Current identity.
- [ ] Effective permissions.
- [ ] Operating system and version.
- [ ] Network interfaces.
- [ ] Routing information.
- [ ] Running services.
- [ ] Local and domain group memberships.
- [ ] Host security controls.
- [ ] Internal network context.

## Phase 09 — Linux Privilege Escalation

The objective is to identify weaknesses in the separation between ordinary users, privileged processes and administrative accounts.

### Enumeration Priorities

| Priority | Check |
| -------- | ----- |
| 1 | Current identity and group memberships |
| 2 | Sudo permissions |
| 3 | SUID and SGID binaries |
| 4 | Linux capabilities |
| 5 | Scheduled jobs and timers |
| 6 | File and directory permissions |
| 7 | Privileged services |
| 8 | Environment and library configuration |
| 9 | Container isolation |
| 10 | Kernel and package versions |

### Initial Manual Checks

```bash
id
sudo -l
uname -a
getcap -r / 2>/dev/null
cat /etc/crontab
systemctl list-timers
ss -tulnp
```

### Commonly Missed Checks

- Custom binaries and scripts.
- Non-standard group memberships.
- Service account permissions.
- Systemd timers.
- Privileged processes using user-controlled files.
- Container and host isolation boundaries.
- Installed packages rather than just kernel versions.

> Review configuration and permissions before investigating version-dependent kernel vulnerabilities.
{: .tip }

## Phase 10 — Windows Privilege Escalation

Windows privilege escalation assessment requires understanding the relationship between access tokens, group memberships, services, scheduled execution and object permissions.

### Enumeration Priorities

| Priority | Check |
| -------- | ----- |
| 1 | Current access token |
| 2 | Local group memberships |
| 3 | Assigned privileges |
| 4 | Service configuration and permissions |
| 5 | Scheduled tasks |
| 6 | File and registry permissions |
| 7 | Installed applications |
| 8 | Security controls |
| 9 | Operating system and patch context |

### Initial Manual Checks

```powershell
whoami /all
whoami /priv
whoami /groups
systeminfo
Get-Service
Get-ScheduledTask
Get-LocalGroup
Get-LocalUser
```

### Commonly Missed Checks

- Indirect privileges through group membership.
- Custom third-party services.
- Permissions on service configuration objects.
- Differences between file permissions and service permissions.
- Scheduled tasks running under privileged identities.
- Application installation and update mechanisms.
- Domain-managed configuration.

## Phase 11 — Active Directory

Active Directory assessment is an iterative process of understanding identities, directory objects, permissions, authentication mechanisms and relationships between systems.

### Initial Enumeration

- [ ] Domain name and domain controllers.
- [ ] Domain users and groups.
- [ ] Computer objects.
- [ ] Organizational units.
- [ ] Password and account policies.
- [ ] Group Policy Objects.
- [ ] Service accounts.
- [ ] Delegated permissions.
- [ ] Domain and forest trusts.
- [ ] Remote access permissions.
- [ ] Directory replication permissions.

### Native Windows Enumeration

```powershell
Get-ADDomain
Get-ADForest
Get-ADDomainController -Filter *
Get-ADUser -Filter *
Get-ADGroup -Filter *
Get-ADComputer -Filter *
Get-ADTrust -Filter *
```

The ActiveDirectory PowerShell module must be available for these commands.

### Areas of Investigation

| Area | Security Consideration |
| ---- | ---------------------- |
| Kerberos | Service accounts and authentication configuration |
| LDAP | Directory visibility and delegated permissions |
| SMB | Share permissions and information exposure |
| ACLs | Effective control over directory objects |
| GPOs | Policy permissions and affected systems |
| LAPS | Local administrator password management |
| Trusts | Cross-domain authorization boundaries |
| Replication | Delegated directory replication permissions |
| Privileged Groups | Direct and indirect membership |

### Commonly Missed Checks

- Nested group memberships.
- Delegated rights outside privileged groups.
- Inherited object permissions.
- Additional domain controllers.
- GPO links and affected organizational units.
- Trust direction and transitivity.
- Differences between graph-reported relationships and effective permissions.

> Active Directory enumeration should be repeated whenever the authorized identity or access context changes.
{: .tip }

## Phase 12 — Pivoting and Network Segmentation

The objective is to understand internal connectivity and determine whether network segmentation and access restrictions operate as intended.

### Enumeration Checklist

- [ ] Identify network interfaces.
- [ ] Identify connected subnets.
- [ ] Review routing tables.
- [ ] Identify locally listening services.
- [ ] Identify management networks.
- [ ] Identify access restrictions between network segments.
- [ ] Confirm that newly discovered networks are in scope.

### Linux

```bash
ip addr
ip route
ss -tulnp
ip neigh
```

### Windows

```powershell
ipconfig /all
route print
netstat -ano
arp -a
```

A newly discovered network does not automatically become part of the authorized assessment scope.

## Phase 13 — Validation and Reporting

A penetration test is not complete simply because a vulnerability has been identified.

Every finding should communicate what was discovered, why it matters, how it was verified and how it can be remediated.

### Finding Structure

| Field | Description |
| ----- | ----------- |
| Title | Clear description of the weakness |
| Severity | Risk rating supported by evidence |
| Affected Assets | Systems or applications involved |
| Description | Technical explanation of the weakness |
| Prerequisites | Conditions required for the finding |
| Evidence | Sanitized and reproducible observations |
| Impact | Potential technical and business consequences |
| Remediation | Actionable recommendations |
| References | Relevant documentation and advisories |
| Retest | Verification of remediation |

### Assessment Closeout

- [ ] Verify all reported findings.
- [ ] Remove temporary assessment artifacts.
- [ ] Revert approved configuration changes.
- [ ] Sanitize sensitive information.
- [ ] Record assessment limitations.
- [ ] Document untested or inconclusive areas.
- [ ] Provide remediation recommendations.
- [ ] Perform retesting where applicable.

## Avoiding Rabbit Holes

Not every interesting observation leads to a vulnerability.

Before spending significant time investigating a potential weakness, ask:

- Have I confirmed the required prerequisites?
- Am I investigating the correct service or component?
- Is the observed version actually affected?
- Is the behavior reproducible?
- Is the relevant functionality accessible?
- Have I overlooked a simpler explanation?
- Have I completed the other enumeration checks?

### Decision Table

| Situation | Recommended Action |
| --------- | ------------------ |
| Missing prerequisite | Document and revisit if new evidence appears |
| Inconsistent results | Establish a reliable baseline |
| Tool reports a vulnerability | Verify the underlying evidence |
| Authentication fails | Review authentication context and requirements |
| Version matches an advisory | Verify configuration and patch status |
| No new evidence emerges | Park the lead and continue enumeration |
| New authorized access obtained | Repeat relevant enumeration |

## Final Coverage Checklist

- [ ] All in-scope assets identified.
- [ ] Relevant TCP and UDP services enumerated.
- [ ] Web applications and endpoints mapped.
- [ ] Authentication and authorization reviewed.
- [ ] Application-specific vulnerabilities assessed.
- [ ] Linux privilege configurations reviewed.
- [ ] Windows privilege configurations reviewed.
- [ ] Active Directory relationships assessed.
- [ ] Network segmentation evaluated.
- [ ] Findings validated and documented.
- [ ] Assessment artifacts removed.
- [ ] Reporting and remediation completed.

## Conclusion

A strong penetration testing methodology is not defined by the number of tools or techniques it contains, but by how effectively it turns observations into meaningful, verified security findings.

Enumerate thoroughly, understand the technology, verify prerequisites, prioritize evidence and revisit earlier assumptions whenever new information becomes available.

**Enumerate → Analyze → Validate → Re-enumerate → Document.**