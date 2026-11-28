---
layout: page
title: "LSASS Attacks"
subtitle: "Dumping LSASS process memory and extracting credentials offline"
permalink: /methodology/passwords/lsass-attacks/
---

The Local Security Authority Subsystem Service (LSASS) enforces local security policy, authenticates users and holds credential material in memory for logged-on sessions. After a user logs in, LSASS caches credentials, creates access tokens and writes events to the security log. Dumping its memory lets an operator extract those credentials offline, which avoids repeated interaction with the live host. This page covers the dump methods and the analysis of the resulting file.

## Background

LSASS runs from `%SystemRoot%\System32\lsass.exe`. Its authentication packages include `Msv1_0.dll` for local logons, `Kerberos.dll` for Kerberos, `Samsrv.dll` for the SAM database and `Lsasrv.dll`, which selects NTLM or Kerberos. The credential types it can hold in memory are the reason a dump is valuable.

## Workflow

1. Confirm local administrator or SYSTEM rights on the host, and confirm the scope permits memory access.
2. Create a memory dump of the LSASS process.
3. Transfer the dump to an analysis host.
4. Parse the dump offline and record each credential type.
5. Test recovered credentials for reuse, and crack any hashes that remain.

## Creating the dump

Task Manager method: open the Details or Processes tab, locate `lsass.exe`, and choose the option to create a dump file. The file `lsass.DMP` is written to the user's `%TEMP%` directory.

Command-line method: find the LSASS process ID, then call the `MiniDump` export of `comsvcs.dll`:

```cmd
tasklist /svc | findstr lsass
```

```powershell
Get-Process lsass
rundll32 C:\Windows\System32\comsvcs.dll, MiniDump LSASS_PID C:\lsass.dmp full
```

This method is faster than the Task Manager method and runs from a command prompt or PowerShell session.

## Offline analysis

Mimikatz runs only on Windows. On a Linux analysis host, pypykatz parses the dump with the `lsa` command:

```bash
pypykatz lsa minidump /path/to/lsass.dmp
```

The output is grouped by package:

| Section | What it contains |
|---------|------------------|
| MSV | Username, domain, SID, LM and NT hashes, SHA1 hash, DPAPI state |
| WDIGEST | Username, domain and, on hosts where it caches clear text, the password |
| Kerberos | Username, domain, and Kerberos keys or tickets held for the session |
| DPAPI | Master keys for logged-on users, used to decrypt DPAPI-protected secrets |

The MSV section provides NT hashes for pass-the-hash or Hashcat mode 1000. WDIGEST is a legacy authentication protocol that, on systems where it is enabled, caches clear-text passwords. The DPAPI master keys let an operator decrypt browser passwords and other stored secrets for the same user.

> The LSASS dump contains credentials for every session on the host, including administrator sessions. Store it securely, delete it after analysis, and record its hash for chain of custody.
{: .warning }

## What to look for

- NT hashes for accounts that log on to multiple systems.
- Clear-text WDIGEST passwords for logged-on users.
- Kerberos material for domain accounts, including administrators.
- DPAPI master keys that can unlock stored browser or application secrets.

## Pitfalls

- Protected LSASS processes and credential guard block memory reads. The dump step can fail without an obvious error.
- Antivirus and endpoint detection tools commonly alert on LSASS access. Confirm the detection policy first.
- A dump from a live server captures a moment in time. Credentials for sessions that ended before the dump will not appear.

## Defense and prevention

Enable LSA protection (RunAsPPL) and Credential Guard, disable WDIGEST clear-text caching, restrict administrative logons to hardened hosts, apply attack surface reduction rules that block LSASS memory access, and alert on suspicious access to the LSASS process. See the [password prevention](/methodology/passwords/prevention/) page.
