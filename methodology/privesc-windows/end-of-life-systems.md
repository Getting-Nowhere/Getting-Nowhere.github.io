---
layout: page
title: "End-of-Life Systems"
subtitle: "Match the patch level of an unsupported Windows host to known local privilege escalation flaws"
permalink: /methodology/privesc-windows/end-of-life-systems/
---

Operating systems past their end of support stop receiving security updates. Many of them remain in service on legacy servers, kiosks and industrial hosts. On those systems, the patch list is short and the public exploits for local privilege escalation are well known. The approach is to read the installed patches, compare them against a database of missing fixes, and then choose a public exploit for a missing patch. This is the same method as the kernel page, applied to a host where the gap is already known to be large.

## Step 1: Confirm the OS and the patch level

```cmd
systeminfo
wmic qfe
```

`wmic qfe` lists the installed hotfixes. If `systeminfo` does not show hotfixes, or the output is incomplete, use the WMI query or the PowerShell equivalent:

```powershell
Get-HotFix | Format-Table -AutoSize
```

Record the OS name, build, install date of the last hotfix and the list of KB numbers.

> Support status is a fact the client can confirm. Check the vendor's lifecycle page for the exact build, since the end date varies by edition.
{: .info }

## Step 2: Enumerate missing patches

Run a patch-comparison script against the host. Sherlock is a PowerShell script that checks a set of known local privilege escalation flaws against the installed patches. Windows Exploit Suggester performs the same comparison from a system information dump.

```powershell
Set-ExecutionPolicy Bypass -Scope Process
Import-Module .\Sherlock.ps1
Find-AllVulns
```

Each finding names a flaw and the patch that fixes it. Review the list and select the findings that match the host's version and architecture.

## Step 3: Check the architecture and the process context

Some exploits need a 64-bit process. On a 64-bit host, a 32-bit process running in WOW64 may not be able to use them. The notes give the example of migrating a shell into a 64-bit process before running the exploit. Check the architecture of the current process:

```powershell
[Environment]::Is64BitProcess
```

## Step 4: Choose and run an exploit for a missing patch

Select a public exploit from a reliable source, read its requirements, and confirm the target build is in its supported list. A common example in the notes is a flaw in the Windows Task Scheduler XML handling (MS10-092). The module is chosen by its CVE or MS number, and the session is set to the local listener and payload. Running the exploit gives a SYSTEM shell.

Do not run public exploit code without reviewing it. Many public proofs of concept are unsafe, and some contain payloads that are not part of the test.

## What to look for

- A build that is out of support and missing several local privilege escalation patches.
- Services that run as SYSTEM and whose binaries are outdated.
- Third-party software with its own privilege escalation issues, which may be easier to reach than the OS flaw.

## Pitfalls

- A failed kernel-level exploit can crash the host. Legacy systems often run critical processes, so confirm the approval and recovery plan first.
- The host may have no recent backup. Back up the target state where possible, or record the state before any change.
- Exploit output on an old host may not match its documentation. Keep a log of each attempt.
- Legacy hosts often lack logging. Note the gap in the report, since it affects detection and response.

## Defense

Retire unsupported operating systems, or isolate them behind a separate network and strict access controls. Where replacement is not possible, enable extended security support where the vendor offers it, and remove unused services and software. Apply the last available cumulative update and restrict local logon to named administrators. Monitor these hosts with extra logging, because they are unlikely to receive fixes.
