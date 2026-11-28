---
layout: page
title: "SeDebugPrivilege"
subtitle: "Use the debug right to read LSASS memory for credentials, or to run code as SYSTEM"
permalink: /methodology/privesc-windows/sedebug-privilege/
---

`SeDebugPrivilege` lets a process attach to and read the memory of any other process, including processes owned by SYSTEM. Developers sometimes receive it to debug applications. Administrators hold it by default. When an account holds it without being an administrator, it is an escalation path in its own right. The two main uses are dumping credentials from LSASS and duplicating the token of a SYSTEM process.

## Step 1: Confirm the privilege

```cmd
whoami /priv
```

Expected output for a user who has been granted the right:

```text
Privilege Name                Description           State
============================= ===================== ========
SeDebugPrivilege              Debug programs        Disabled
SeChangeNotifyPrivilege       Bypass traverse       Enabled
```

If the state is `Disabled`, enable it with a token-adjustment script before the next step. The privilege is not usable while it is disabled.

## Step 2: Dump LSASS memory

LSASS holds the credential material for users who have logged on. A minidump of it can be read offline, which keeps the credential work off the live host.

```cmd
procdump.exe -accepteula -ma lsass.exe lsass.dmp
```

Then load the dump in a credential extraction tool offline. In Mimikatz, enable logging first so that the output is saved:

```text
mimikatz # log
mimikatz # sekurlsa::minidump lsass.dmp
mimikatz # sekurlsa::logonpasswords
```

The output contains NTLM hashes for recently logged-on accounts. Those hashes can be used for pass-the-hash only when the engagement scope allows it.

### Manual dump without tools

If the tools cannot be transferred and the session is interactive (for example over RDP), open Task Manager, select the Details tab, choose `lsass.exe`, and select Create dump file. Copy the dump off the host through an approved channel.

## Step 3: Use the privilege for SYSTEM execution

A process running as SYSTEM can be opened because of this right. Its token can be duplicated and attached to a new child process. The notes describe a PoC script that takes the process ID of a SYSTEM process such as `winlogon.exe` and launches a command under its token.

```powershell
tasklist
```

Look for a SYSTEM process with a stable PID, such as `winlogon.exe`, and pass that PID to the chosen tool. Use a PoC from a maintained repository, and read its current usage notes first, because some PoCs have changed their syntax.

## What to look for

- `SeDebugPrivilege` enabled or enable-able in the token of a non-administrator.
- Credential material for other accounts in memory, in particular a domain admin session on a server.
- A usable SYSTEM process whose PID can be found with `tasklist`.

## Pitfalls

- Protected Process Light (PPL) and Credential Guard can block LSASS reads. Check the protections first, and expect a failed dump on hardened hosts.
- Dumping LSASS is one of the most heavily monitored actions on Windows. Confirm the engagement allows it and record the time of the action.
- Antivirus can quarantine the dump tool or the dump file. Test in the lab where possible.
- Dumps contain credentials for every logged-on account. Handle them as client data, transfer them securely, and delete them after the test.

## Defense

Remove the debug right from all non-developer accounts, and keep the default assignment to administrators only. Enable LSA protection (RunAsPPL) and Credential Guard where the platform supports them. Monitor for processes that open LSASS with read-memory rights, and for ProcDump or similar tools run against `lsass.exe`. Limit the number of accounts that log on to sensitive hosts, so that fewer credentials sit in memory.
