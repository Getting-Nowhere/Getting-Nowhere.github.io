---
layout: page
title: "Services Prevention"
subtitle: "Remediation controls for each common network service"
permalink: /methodology/services-attacks/prevention/
---

Each service attack in this section depends on a configuration choice or a credential weakness. This page summarises the controls that remove those dependencies, grouped by service, so that findings can be converted into specific remediation recommendations. Apply the controls in the order of impact: remove anonymous access and default configuration first, then harden authentication, then reduce privilege and exposure.

## Control matrix

| Service | Main risk | Key controls |
|---------|-----------|--------------|
| SMB | Anonymous listing, share content exposure, NTLM relay and hash capture | Disable null sessions, require SMB signing, apply least-privilege share permissions, unique local admin passwords, restrict NTLM |
| RDP | Password guessing, session hijacking, pass the hash | Restrict exposure to management networks, require Network Level Authentication, enforce lockout, enable multi-factor authentication, leave Restricted Admin off unless needed |
| FTP | Anonymous access, plain-text credentials, path traversal | Disable anonymous access, use SFTP or FTPS, chroot users, patch the server, restrict writable directories |
| DNS | Zone transfer, dangling records, spoofing | Limit zone transfers to secondaries, remove unused CNAMEs, deploy DNSSEC, monitor record changes |
| Email | Username enumeration, spraying, open relay | Disable VRFY and EXPN, uniform responses for unknown users, close the relay, require authentication, enforce MFA |
| MSSQL | Command execution, file write, impersonation, linked server abuse | Disable xp_cmdshell and Ole Automation, remove IMPERSONATE grants, limit linked servers, avoid sysadmin for application accounts |
| MySQL | File read and write, excessive grants | Set secure_file_priv, remove the FILE privilege from application accounts, restrict root access to local hosts |

## Authentication controls

- Enforce a password policy with length and complexity rules, and ban commonly used or breached passwords.
- Set an account lockout threshold that is high enough to tolerate normal typing errors and low enough to slow spraying.
- Monitor for many failed logins across many accounts, which is the signature of spraying.
- Require multi-factor authentication for remote access, mail and administrative logons.
- Do not reuse local administrator passwords across hosts. Use a local administrator password solution.

## Network controls

- Restrict service ports to the networks that need them and place databases and management services behind a gateway.
- Block outbound SMB from servers that do not need it, which limits hash capture through database procedures.
- Disable the FTP `PORT` command or restrict data connections where it is not needed.
- Keep mail, DNS and file services patched and on supported versions.

## Configuration review

- Test anonymous and null-session access on every service during the baseline review.
- Review database instance settings after each change, especially `xp_cmdshell`, Ole Automation, linked servers and `secure_file_priv`.
- Audit DNS zones for transfer permissions and for CNAME records pointing to resources that no longer exist.
- Remove test accounts, default credentials and sample databases from production systems.

> Verify each control after deployment. A setting that is documented but not applied is a finding in its own right.
{: .tip }

## Reporting

For each finding, state the affected service and host, the attack path that was demonstrated, the privilege level reached, and the control from this page that closes it. Prioritise findings that reach administrative access, command execution or domain-wide credential exposure.
