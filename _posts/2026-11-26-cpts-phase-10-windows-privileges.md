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

## Decision tree

```text
Windows session
  |-- Token privileges -> check enabled state and intended delegation
  |-- Services -> inspect service ACL, binary ACL and run-as identity
  |-- Scheduled tasks -> inspect principal, action and file ACL
  |-- Special groups -> review delegated resource access
  `-- Version lead -> verify build, patch and configuration
       -> Document confirmed boundary or park
```

## 1. Inventory token, host and active services

```cmd
whoami /priv
whoami /groups
systeminfo
tasklist /svc
net user
net localgroup
net localgroup administrators
net accounts
netstat -ano
query user
```

```powershell
Get-HotFix | Format-Table -AutoSize
Get-MpComputerStatus
Get-AppLockerPolicy -Effective | Select-Object -ExpandProperty RuleCollections
```

Distinguish local and domain groups, enabled privileges and privileges merely present in the token. A privilege's name does not prove a usable path.

## 2. Services: check three different permission boundaries

```powershell
Get-Service
Get-CimInstance Win32_Service | Select-Object Name, StartName, State, PathName
sc.exe qc SERVICE_NAME
icacls "C:\Path\To\Service.exe"
accesschk.exe -quvcw SERVICE_NAME
```

The source notes use AccessChk and SharpUp (`SharpUp.exe audit`) for permission review. They are external tools, not built-in commands. Use approved copies and verify manual results.

| Check | Why it matters |
|---|---|
| Service object ACL | Who can change service configuration? |
| Executable ACL | Who can modify the actual binary? |
| Parent directory ACL | Who can create or replace relevant files? |
| Service identity | Which account runs the service? |
| Path quoting | Is an unquoted path actually ambiguous and is a relevant directory writable? |

If one of these conditions is missing, do not conclude the service is exploitable. Record the permission and the exact service identity; no service restart or replacement is needed to establish the configuration finding.

## 3. Scheduled tasks and applications

```powershell
Get-ScheduledTask | Select-Object TaskName,TaskPath,State
Get-Process -Id PROCESS_ID
Get-Service | Where-Object {$_.DisplayName -like '*PRODUCT*'}
```

Map listening ports to process IDs, then to executable paths and associated services. Inspect task principal, action and action-file ACL. Avoid `Win32_Product` on production systems because querying it can trigger MSI consistency checks; the source notes use it, but registry/inventory data is preferable when available.

## 4. Token and group branches

- `SeImpersonatePrivilege` / `SeAssignPrimaryTokenPrivilege`: check service-account context, OS build and actual token state.
- `SeDebugPrivilege`: review why the account can access other processes; do not dump process memory to establish the assignment.
- `SeTakeOwnershipPrivilege`: establish which objects are affected and why the privilege is present.
- Backup, Server, Print, DNS, Event Log Readers and Hyper-V groups: distinguish each group's intended delegation and affected resource from general administrator membership.
- UAC: distinguish a filtered administrator token from an ordinary user; check integrity level and elevation policy.
- DLL-related findings: verify the actual loading process, DLL resolution and ACLs rather than assuming every missing DLL is a viable path.

**Common misses:** service ACL versus binary ACL; inherited directory permissions; disabled tasks; group membership without effective access; unquoted paths without writable candidates; OS version without patch evidence.

**Study-note basis:** Initial Enumeration, Situational Awareness, Weak Permissions, Vulnerable Services, Windows Privileges Overview, Windows Built in Groups, User Account Control, DLL Injection.

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
