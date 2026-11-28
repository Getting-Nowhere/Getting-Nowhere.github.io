---
layout: page
title: "More Credential Theft"
subtitle: "Recover saved credentials from Credential Manager, browsers, password managers, mail, remote access tools and the registry"
permalink: /methodology/privesc-windows/more-credential-theft/
---

Beyond loose files, Windows and its applications store credentials in managed stores: the Credential Manager, browser password vaults, password managers, remote access clients and the registry. This page covers how to enumerate each store and recover what the current account can access. Access to another user's store usually requires that user's context, administrative rights, or the DPAPI material that protects the data.

## Store overview

| Store | Where to look | Recovery approach |
|---|---|---|
| Credential Manager | cmdkey /list | Reuse with runas /savecred |
| Browser password vaults | Per-user profile, DPAPI-protected | Run the tooling in the user's context |
| Password managers | Local .kdbx vault files | Offline hash extraction and cracking |
| Mailboxes | Exchange mail of a domain user | Keyword search of mail |
| Remote access clients | HKCU and profile folders | Multi-tool sweep (LaZagne, SessionGopher) |
| Auto-logon | HKLM Winlogon registry key | Read the registry value directly |
| Saved sessions | HKCU PuTTY sessions | Read the registry value directly |
| Wireless profiles | netsh wlan profiles | Requires local administrator |

## Workflow

### 1. Credential Manager

```cmd
C:\htb> cmdkey /list
C:\htb> runas /savecred /user:DOMAIN\USERNAME "COMMAND"
```

Stored entries show the target and the username. The saved password is then used by runas without being displayed. Reusing it to launch a command as that account is the escalation step, and it should be tested only with approval.

### 2. Browsers

Chromium-based browsers store saved logins in an SQLite database, with values protected by DPAPI. Tools such as SharpChrome can decrypt the logins when run in the user's own context:

```powershell
PS C:\htb> .\SharpChrome.exe logins /unprotect
```

Browser credential collection generates process creation (4688) and DPAPI activity (16385) events. File access auditing (4662, 4663) can add fidelity to detection.

### 3. Password managers

If a KeePass .kdbx database is found, copy it to an analysis host and extract a crackable hash. Mode 13400 is the hashcat mode for KeePass.

```text
keepass2john <database>.kdbx > keepass_hash
hashcat -m 13400 keepass_hash <wordlist>
```

Enterprise vaults such as CyberArk can be reached by password reuse or guessed weak passwords. Cracking is offline and should be scoped and timeboxed.

### 4. Mail

With a domain user context on a domain-joined system and an Exchange server available, mailboxes can be searched for terms such as "password", "creds" or "credentials". MailSniper is one tool for this.

### 5. Broad sweeps and remote access clients

```powershell
PS C:\htb> .\lazagne.exe all
PS C:\htb> Import-Module .\SessionGopher.ps1
```

LaZagne covers browsers, chat clients, databases, mail, Autologon, Credman, DPAPI and LSA secrets. SessionGopher reads saved PuTTY, WinSCP, FileZilla, SuperPuTTY and RDP sessions, and it can search the HKEY_USERS hive for all profiles that have logged on to a domain-joined host. Run its main function as documented by the project.

### 6. Manual registry review

```cmd
C:\htb> reg query "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon"
C:\htb> reg query HKEY_CURRENT_USER\SOFTWARE\SimonTatham\PuTTY\Sessions
```

Winlogon may hold AutoLogon values, including `DefaultUserName` and a plaintext `DefaultPassword` when `AdminAutoLogon` is 1. PuTTY stores proxy credentials in plaintext under each saved session, and that key is protected by the owning user's registry permissions. An administrator can read the same data under HKEY_USERS.

### 7. Wireless profiles

```cmd
C:\htb> netsh wlan show profile
C:\htb> netsh wlan show profile name="PROFILE_NAME" key=clear
```

If the wireless profile stores the pre-shared key, the key is shown in clear text. This requires local administrator on a machine that has joined the network.

## What to look for

- Saved credentials for accounts more privileged than the current one.
- Autologon or saved session credentials for admin or service accounts.
- A password manager vault on a workstation that belongs to an administrator.
- Wireless keys that unlock a segment the engagement is scoped to reach.

## Pitfalls

- Credential Manager and DPAPI secrets are tied to the user profile. Without that context, the data is not readable.
- Many saved credentials are still protected by MFA at the service, so a recovered password may not be enough.
- Broad tools such as LaZagne are signature-heavy and may be blocked or flagged by EDR. Plan the approach with the client.
- Cracking a vault consumes time. Set a budget before starting.

## Defense

Turn off saved credentials for privileged accounts, and do not save RDP or admin credentials in Credential Manager. Use Sysinternals Autologon instead of the plaintext Winlogon values, since it stores the password as an LSA secret. Require MFA for password managers, enforce Credential Guard where supported, and rotate local administrator passwords with a managed solution. Remove saved proxy credentials from PuTTY sessions, and rotate wireless pre-shared keys when staff leave.
