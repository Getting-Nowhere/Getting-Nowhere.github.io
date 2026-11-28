---
layout: page
title: "SeImpersonate and Potato Attacks"
subtitle: "Abuse the impersonation right of a service account to obtain a SYSTEM token"
permalink: /methodology/privesc-windows/seimpersonate-potato/
---

Every process runs with an access token that describes its account. The impersonation rights `SeImpersonatePrivilege` and `SeAssignPrimaryTokenPrivilege` allow a process to act with the token of another user or service that connects to it. Many service accounts hold `SeImpersonatePrivilege` by default, and those accounts often run web servers, database servers and automation tools. The "potato" family of techniques tricks a SYSTEM-level component into authenticating to an attacker-controlled endpoint, and then reuses the token it presents. The result is a SYSTEM token from an account that could not otherwise reach SYSTEM.

## Step 1: Confirm the right

```cmd
whoami /priv
whoami
```

A service account with `SeImpersonatePrivilege` in the `Enabled` state is the precondition. Confirm the account before choosing a tool, because the candidate tools differ by OS build.

## Step 2: Identify a likely foothold

Potato attacks usually start from a service account, not an interactive user. Common examples in the notes are a SQL Server login that runs commands through an extended procedure, or an IIS application pool. Confirm command execution as that account first.

```text
whoami
whoami /priv
```

Output should show the service account, and the impersonation right in the list.

## Step 3: Choose a potato variant for the OS build

| Variant | Typical use | Notes from the source |
| --- | --- | --- |
| JuicyPotato | Older Windows builds | Does not work on Windows Server 2019 or Windows 10 build 1809 and later |
| PrintSpoofer | Newer builds that run the print spooler | Can spawn a SYSTEM process in the current console, on a desktop, or as a reverse shell |
| RoguePotato | Named as a related variant | The source gives no usage detail; confirm its requirements from its own documentation |

Start with the variant that matches the build. Check the build number first:

```cmd
systeminfo | findstr /B /C:"OS Name" /C:"OS Version"
```

## Step 4: Run the tool

Upload the chosen binary to a writable folder such as `C:\Windows\Temp`, then run it with the parameters from its documentation. The notes show a PrintSpoofer pattern in which the tool runs a command as SYSTEM, and that command opens a reverse shell to the listener.

```text
PrintSpoofer.exe -c "<command to run as SYSTEM>"
```

Replace the command with a verified one, and set the listener before running the tool. A failed run usually means the wrong variant for the build, or a blocked spooler service.

## What to look for

- Service accounts (IIS, SQL, scheduled-task runners) with `SeImpersonatePrivilege` enabled.
- A Windows build where the chosen variant is supported.
- A writable folder for the binary, and outbound access for any reverse-shell callback.

## Pitfalls

- JuicyPotato-style tools depend on specific COM and DCOM behaviour, and they fail on newer builds. Do not spend time on them when the build check already rules them out.
- PrintSpoofer depends on the print spooler. If the spooler is disabled, use a different variant.
- The SYSTEM process created by the tool runs in a new session, so check the token with `whoami` before assuming a stable shell.
- Antivirus signatures for these tools are common. Use the lab to test the binary, and keep a copy of the original tool hash in the notes.

## Defense

Remove `SeImpersonatePrivilege` from accounts that do not need it, since the default grant is broader than most services require. Run services under virtual or managed service accounts with minimal rights. Disable the print spooler on servers that do not print. Keep builds patched, and monitor for unexpected child processes of service accounts, particularly cmd.exe or PowerShell started by SQL Server, IIS worker processes or spooler-related binaries.
