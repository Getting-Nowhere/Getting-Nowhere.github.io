---
title: "Phase 10 — Windows Privilege Escalation Assessment"
date: 2026-11-26 17:40:00 +0530
categories: [CPTS, Privilege Escalation]
tags: ["PRIVILEGE ESCALATION"]
description: Review Windows tokens, groups, service permissions, scheduled tasks, OS controls and patch context.
permalink: "/posts/cpts-phase-10-windows-privileges/"
toc: true
---

Review Windows tokens, groups, service permissions, scheduled tasks, OS controls and patch context.

> Use this methodology only for systems and test identities within an explicitly authorized assessment. Validate the minimum necessary impact and preserve sanitized evidence.
{: .tip }

## Assessment workflow

### 1. Establish the Windows baseline

Record user SID, effective groups, token privileges, elevation status, OS build, installed updates, running services, processes and network interfaces. Distinguish local administrator, domain administrator and LocalSystem.

### 2. Review token and group privileges

Assess the intended use of SeImpersonatePrivilege, SeAssignPrimaryTokenPrivilege, SeDebugPrivilege and SeTakeOwnershipPrivilege. Review built-in and delegated groups, including Event Log Readers, Server Operators, Print Operators, Hyper-V Administrators and DnsAdmins where applicable.

### 3. Inspect privileged services and tasks

Identify service account, executable path, quoted path handling, service-control permissions, file and parent-directory ACLs, scheduled tasks and startup entries. Confirm effective permissions using non-mutating checks.

### 4. Review credential and configuration exposure

Assess permissions on unattended installation files, application configurations, histories and credential storage using redacted or synthetic evidence. Treat saved credentials and process memory as sensitive.

### 5. Review loader and operating-system controls

Assess DLL search order, application paths, UAC context, installed software and patch status. Review restricted desktop or Citrix configuration separately; avoid changing user sessions or OS components.

### 6. Recommend precise remediation

Restrict service-control and file ACLs, protect scheduled tasks, minimize group/token privileges, secure credential storage and maintain supported, patched operating systems.

## Decision checklist

| If you observe | Then check | Next action |
| --- | --- | --- |
| Special privilege is listed | Verify whether it is enabled, relevant and expected for the current role. | Inspect the affected trust boundary rather than assuming escalation. |
| Service path is unquoted or writable | Confirm exact service configuration and directory/file permissions. | Record the execution context and intended restrictions. |
| Task executes under a privileged identity | Review task definition and executable/working-directory ACLs. | Confirm low-privilege write access before classifying. |
| A high-impact group is present | Determine effective rights on the actual host. | Review local/domain differences and nested membership. |
| A vulnerable build is suspected | Check exact update status and component configuration. | Treat kernel and OS exploit testing as high impact. |

## Read-only reference commands

Examples use an approved environment. Replace placeholders with authorized lab values. Commands are reference examples, not an instruction to run them against arbitrary hosts.

```powershell
whoami /all
systeminfo
tasklist /svc
ipconfig /all
Get-CimInstance Win32_Service | Select-Object Name,StartName,State,PathName
Get-ScheduledTask | Select-Object TaskName,TaskPath,State
```

## Common mistakes and missed checks

- Treating an enabled token privilege as proof of a usable attack path.
- Checking a service file but not its directory or service-control ACL.
- Confusing administrative group membership with an elevated token.

## When to stop and reassess

Do not change service configuration, take ownership, inject code or read credential process memory to establish a public-facing assessment finding.

## Expected deliverable

A reproducible local privilege and service-permission inventory with actionable remediation.

## Related methodology

- [Complete penetration testing methodology]({{ '/posts/cpts-methodology/' | relative_url }})
- [Phase 11 — Active Directory Assessment]({{ '/posts/cpts-phase-11-active-directory/' | relative_url }})
- [Phase 13 — Validation, Reporting and Closeout]({{ '/posts/cpts-phase-13-reporting/' | relative_url }})

## Study basis

Adapted from CPTS study topics: Windows Privilege Escalation: Lay of the Land, User Privileges, Group Privileges, Credential Theft, OS and Prevention. The sequencing and validation criteria are an editorial synthesis for a public assessment reference.
