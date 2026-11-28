---
layout: page
title: "Rights, Privileges, and Built-in Groups"
subtitle: "Which built-in groups and user rights lead to domain compromise, and how to check them"
permalink: /methodology/active-directory/ad-rights-and-privileges/
---

Rights and privileges decide what an account can do once it is logged in. A right usually controls access to an object, such as a file or a directory object. A privilege allows an action on the system, such as taking backups or debugging a process. Built-in AD groups grant privileges by default, and several of them are effectively equal to Domain Admin. Map these groups early, because membership in one of them is often a shorter path than a password crack.

## Built-in groups to review

| Group | Why it matters |
|---|---|
| Administrators | Full control of a computer, or of the whole domain when on a DC |
| Domain Admins | Full administration of the domain and local admin on every domain-joined host |
| Enterprise Admins | Forest-wide changes such as adding child domains or creating trusts. Exists only in the forest root |
| Schema Admins | Can change the AD schema. Exists only in the forest root |
| Account Operators | Can create and modify most accounts and log on locally to DCs |
| Backup Operators | Can back up and restore any file, including copies of the SAM and NTDS.dit. Treat as Domain Admin |
| Server Operators | Can modify services, access SMB shares, and back up files on DCs. Exists only on DCs |
| Print Operators | Can manage printers on DCs and load malicious drivers. Can log on to DCs locally |
| DnsAdmins | Access to DNS server configuration. Exists when the DNS role is or was installed on a DC |
| Hyper-V Administrators | Full control of Hyper-V. Virtual DCs in the domain make these members effectively Domain Admins |
| Group Policy Creator Owners | Create, edit, and delete GPOs in the domain |
| Event Log Readers | Read event logs on local computers |
| Remote Desktop Users | Can log on over RDP |
| Remote Management Users | Can connect over WinRM |
| Protected Users | Extra protection against credential theft and Kerberos abuse |
| Pre-Windows 2000 Compatible Access | Legacy group that can allow anonymous reads of AD |

## User rights to review

| Privilege | Abuse |
|---|---|
| SeRemoteInteractiveLogonRight | Log on over RDP and reach sensitive data or escalate |
| SeBackupPrivilege | Read the SAM, SYSTEM hive, and NTDS.dit through backup semantics |
| SeDebugPrivilege | Read LSASS memory and extract stored credentials |
| SeImpersonatePrivilege | Impersonate a privileged token, for example SYSTEM, with local escalation tools |
| SeLoadDriverPrivilege | Load a driver that can be used to escalate |
| SeTakeOwnershipPrivilege | Take ownership of an object and then grant access to it |

## Checking rights

```powershell
whoami /priv
Get-ADGroup -Identity "Server Operators" -Properties *
Get-ADGroup -Identity "Domain Admins" -Properties * | Select-Object DistinguishedName, GroupCategory, GroupScope, Name, Members
```

## Reading the output

- A standard domain user typically holds only a few low-risk privileges, such as SeChangeNotifyPrivilege and SeIncreaseWorkingSetPrivilege.
- A member of a privileged group shows a long list. Privileges marked Disabled are still held. The holder can enable them on an elevated token.
- Compare the privileges of a service account or a backup account against the table above. A backup account with SeBackupPrivilege is an immediate high-value target.

> The notes' examples show DA rights differing between a standard and an elevated token. Always check with an elevated shell when assessing an admin account.
{: .info }

## What to look for

- Non-administrative accounts in Backup Operators, Account Operators, Server Operators, or Print Operators.
- Accounts with SeDebugPrivilege or SeBackupPrivilege on hosts where they should not have them.
- Virtualisation or DNS administrators with access to a DC.
- Empty built-in groups that later gain members. Monitor them.

## Pitfalls

- Built-in group names differ by language. Use the well-known SID where localisation may matter.
- Group membership is only half the picture. Check local rights on each host, since a group may have been given local admin through GPO.

## Defense

Keep these groups empty or nearly empty. Use separate admin accounts. Deny interactive logon for operator groups on DCs. Monitor membership changes to every group in the table. See [AD Security Basics](/methodology/active-directory/ad-security-basics/) and [Privileged Access](/methodology/active-directory/privileged-access/).
