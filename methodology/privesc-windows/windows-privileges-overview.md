---
layout: page
title: "Windows Privileges Overview"
subtitle: "Reference for security principals, user rights and the privileges that group membership grants"
permalink: /methodology/privesc-windows/windows-privileges-overview/
---

Windows decides what an account can do by comparing the SIDs in its access token against the access control entries of the object being used. Group membership and user rights assignments change the token. Some of those rights are powerful enough to bypass object permissions entirely. This page is a reference for the rights that matter for escalation. The pages that follow cover each one in turn.

## Authorization basics

1. Every security principal (user, computer, group or process security context) has a unique SID that stays with it for its lifetime.
2. When a user opens an object, such as a file on a share, the token is compared with the object's security descriptor.
3. Each ACE is checked. The result is an allow or deny decision.
4. User rights (privileges) are a separate layer. They allow actions such as taking ownership or debugging processes, and they can apply even when the object's ACL would deny access.

## Step 1: Check the privileges held by the current token

```powershell
whoami /priv
whoami /groups
```

A privilege that is listed as `Disabled` is assigned to the account but not active in the token. It has to be enabled before it can be used, which may require a token-adjustment script or an elevated process.

| State in `whoami /priv` | Meaning | Next action |
| --- | --- | --- |
| `Enabled` | Active in the current token | Use it directly |
| `Disabled` | Assigned, not active | Enable it, then re-check |
| Not listed | Not assigned to the account or token | Look at group membership |

## Step 2: Map groups to privileges

| Group | Why it matters |
| --- | --- |
| Administrators | Full control of the local host |
| Server Operators | Control of services and SMB, plus backup and restore rights |
| Backup Operators | Bypass file ACLs for backup, and local logon to domain controllers |
| Print Operators | Load drivers on a DC and log on locally |
| Hyper-V Administrators | Full control of virtual machines, which may host domain controllers |
| Account Operators | Modify non-protected accounts and groups |
| DnsAdmins | Load a plugin DLL into the DNS service, which runs as SYSTEM |
| Event Log Readers | Read event logs, which may contain command lines with credentials |
| Remote Desktop Users | Interactive access over RDP |
| Remote Management Users | PowerShell remoting access |

> Membership in a group that looks harmless can still carry a privilege that is equal to administrator. Check every non-standard group, not only the obvious ones.
{: .warning }

## User rights of interest

| Right | Standard assignment | Abuse class |
| --- | --- | --- |
| SeImpersonatePrivilege | Administrators, Local Service, Network Service, Service | Token impersonation (potato attacks) |
| SeAssignPrimaryTokenPrivilege | Service accounts | Assign a token to a new process |
| SeDebugPrivilege | Administrators | Open any process, including LSASS |
| SeTakeOwnershipPrivilege | Administrators | Take ownership of any securable object |
| SeBackupPrivilege | Administrators | Read any file for backup |
| SeRestorePrivilege | Administrators | Write any file during restore |
| SeLoadDriverPrivilege | Administrators | Load a kernel driver |
| SeTcbPrivilege | Administrators, services | Act as part of the operating system |
| SeSecurityPrivilege | Administrators | Manage the audit log and read the Security log |

## Step 3: Confirm where the privilege came from

```powershell
net user USERNAME /domain
net localgroup Administrators
gpresult /r
```

Use `gpresult /r` to find user rights granted through local or domain Group Policy. A right can come from a GPO rather than from group membership, so a clean group list does not rule out the privilege.

## What to look for

- A `Disabled` privilege that can be enabled by the current user. This is an escalation path, not a finding to ignore.
- Service accounts holding `SeImpersonatePrivilege`. These are common and frequently exploitable.
- Non-administrator accounts in Backup Operators, Server Operators, Print Operators or DnsAdmins.
- Rights assigned by GPO to unexpected accounts.

## Detection

Event ID 4672 (special privileges assigned to a new logon) records sensitive privileges at logon. Tune it to alert on privileges that should never be assigned, and on those that should belong to a short list of accounts.

## Defense

Assign user rights only to the accounts that need them, and review User Rights Assignment in Group Policy on a schedule. Remove unneeded members from built-in operator groups, and treat those groups as equivalent to administrator when reviewing them. Monitor event 4672 for sensitive privileges on unexpected accounts.
