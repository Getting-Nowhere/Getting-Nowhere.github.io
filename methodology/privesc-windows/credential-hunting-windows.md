---
layout: page
title: "Credential Hunting on Windows"
subtitle: "Search files, scripts, histories and shares for plaintext or recoverable credentials"
permalink: /methodology/privesc-windows/credential-hunting-windows/
---

Credential hunting searches the file system and shares for passwords that administrators and users left in configuration files, scripts, histories and notes. It is one of the cheapest escalation paths because it needs no exploit, only read access to the file in question.

## Workflow

1. Check the high-value locations first (web configuration, unattended install files, PowerShell history, scripts, user profiles).
2. Search file contents for keywords.
3. Search for file names and extensions.
4. Search shares, using a crawler in Active Directory environments.
5. Triage every hit: location, owner, last write time, and whether the credential is still valid.

### Step 1: High-value locations

| Location or file | Why it matters |
|---|---|
| C:\inetpub\wwwroot\web.config | IIS connection strings, sometimes with plaintext credentials |
| Unattended install files (unattend.xml, sysprep files) | Auto-logon and account creation settings, which may hold passwords in plaintext or base64 |
| PowerShell PSReadLine history | Commands typed with inline credentials |
| Scripts and configuration under C:\ProgramData or C:\Scripts | Service and backup scripts often hold service account passwords |
| Password manager databases (.kdbx) and files named passwords, pass, creds | Vault files for offline cracking or direct use |
| Exported PowerShell credential XML (Export-Clixml) | DPAPI-protected; readable by the same user on the same host |
| Sticky Notes database (plum.sqlite and its -wal file) | Notes stored in SQLite; the WAL file can hold recent text |
| Chrome Custom Dictionary.txt | Words typed into password fields and added to the dictionary |

### Step 2: Content search

```cmd
C:\htb> findstr /SIM /C:"password" *.txt *.ini *.cfg *.config *.xml
C:\htb> findstr /spin "password" *.*
```

```powershell
PS C:\htb> select-string -Path C:\Users\USERNAME\Documents\*.txt -Pattern password
PS C:\htb> findstr /SI /M "password" *.xml *.ini *.txt
```

### Step 3: File name and extension search

```cmd
C:\htb> dir /S /B *pass*.txt *pass*.xml *pass*.ini *cred* *vnc* *.config*
C:\htb> where /R C:\ *.config
```

```powershell
PS C:\htb> Get-ChildItem C:\ -Recurse -Include *.rdp, *.config, *.vnc, *.cred -ErrorAction Ignore
```

### Step 4: PowerShell history

```powershell
PS C:\htb> (Get-PSReadLineOption).HistorySavePath
PS C:\htb> gc (Get-PSReadLineOption).HistorySavePath
```

To read every profile on the host, iterate over the user folders under C:\Users and read each PSReadLine history file, suppressing errors for folders the current user cannot access.

### Step 5: Shares

In an Active Directory environment, a share crawler such as Snaffler can classify interesting files across many shares at once. Limit the crawl to agreed scope.

### Other files of interest

```text
%SYSTEMDRIVE%\pagefile.sys
%WINDIR%\repair\sam, %WINDIR%\repair\system, %WINDIR%\repair\security
%WINDIR%\system32\config\*.sav
%WINDIR%\debug\NetSetup.log
%USERPROFILE%\ntuser.dat
C:\ProgramData\Configs\*
```

Many of these are locked or protected by default. A copy of a SAM and SYSTEM pair is still high value, because it allows local account hashes to be extracted offline.

## What to look for

- A credential that works for a higher-privilege account or for another host.
- Service or backup account passwords in scripts and configuration.
- Credentials typed on a command line in shell history.
- Password vaults or exported credential objects belonging to administrators.

> Test each recovered credential against the minimum set of services needed to confirm it, and record which account it belongs to. Do not spray it across the environment without approval.
{: .warning }

## Pitfalls

- Recursive searches of C:\ are slow and noisy. Start with the locations in step 1.
- Output often contains the secret itself. Handle it under the engagement's data-handling rules and redact it in the report.
- Histories and notes can be stale. Verify a credential before relying on it.
- Access-denied errors do not mean nothing is there; they mean the current account lacks read rights.

## Defense

Keep secrets out of configuration files, scripts and shared drives. Use managed service accounts or a secrets vault. Clear PowerShell history where it is not needed, and restrict share permissions to least privilege. Run periodic secret scanning on shares and repositories so exposed values are found before an attacker finds them.
