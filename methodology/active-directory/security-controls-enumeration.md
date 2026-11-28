---
layout: page
title: "Enumerating Security Controls"
subtitle: "Find out which defenses will block your tools before you run them"
permalink: /methodology/active-directory/security-controls-enumeration/
---

Before you run tools on a host, check what is watching it and what is blocking it. Antivirus, application allow-listing, PowerShell language restrictions, and LAPS all affect whether your next step works and how loud it is. Checking early saves time and avoids tripping alerts unnecessarily. This page covers the four controls that the notes cover: Windows Defender, AppLocker, PowerShell Constrained Language Mode, and LAPS.

## Workflow

1. Check Windows Defender status.
2. Check AppLocker rules, including the ones that apply to the current user.
3. Check the PowerShell language mode.
4. Check LAPS coverage and who can read LAPS passwords.
5. Record the results in the engagement notes before you start the next phase.

## Step 1: Windows Defender

```powershell
Get-MpComputerStatus
```

```cmd
sc query windefend
```

Look for `RealTimeProtectionEnabled`. A value of `True` means real-time scanning is active, so tools that are written to disk or run unobfuscated will probably be detected.

## Step 2: AppLocker

```powershell
Get-AppLockerPolicy -Effective | select -ExpandProperty RuleCollections
```

AppLocker is an allow-list. Many organizations block `cmd.exe` and `powershell.exe` by path but forget other copies of PowerShell, such as the 32-bit build under `SysWOW64`. Read the rules and check whether another path is allowed. Do not try to bypass the policy unless the rules of engagement allow it.

## Step 3: PowerShell Constrained Language Mode

```powershell
$ExecutionContext.SessionState.LanguageMode
```

If the result is `ConstrainedLanguage`, the session can use only a limited set of .NET types and cannot use COM objects or XAML. Many PowerView and similar functions will fail in this mode, so plan to use a different tool or a different host.

## Step 4: LAPS

LAPS randomizes and rotates the local administrator password on each computer. Its purpose is to stop one local admin password from working across the network. Three commands from the notes show where it is deployed and who can read it.

```powershell
Find-LAPSDelegatedGroups
Find-AdmPwdExtendedRights
Get-LAPSComputers
```

- `Find-LAPSDelegatedGroups` lists the groups that have been explicitly delegated the right to read LAPS passwords. These are often ordinary users or service groups, and they are a common finding.
- `Find-AdmPwdExtendedRights` checks each LAPS computer for groups with read access and for users with All Extended Rights.
- `Get-LAPSComputers` lists computers with LAPS enabled, along with the password and its expiration date, where the current account is permitted to read it.

## What to look for

- Defender real-time protection set to `True`
- AppLocker rules that block `cmd.exe` and PowerShell by path but miss alternate binaries
- `ConstrainedLanguage` mode, which changes which tools will work
- Non-administrative groups listed by `Find-LAPSDelegatedGroups`
- Any LAPS computer whose password you can read, which is a route to local admin on that host

## Pitfalls

- A tool that works in one session may fail in the next after a policy refresh. Recheck the status at the start of each phase.
- LAPS passwords are secrets. Record only the computer name and the fact that you read the password. Do not paste plaintext passwords into reports.
- LAPS only protects the local administrator account. It does not stop domain-level abuse, and it does not help if the password is readable by too many accounts.

## Defense

- Limit which groups can read LAPS passwords. Review delegation with the same care as other privileged rights.
- Enforce AppLocker by path and by publisher, and block alternate PowerShell binaries as well as the standard ones.
- Keep Defender real-time protection on and report any host where it is disabled.
- Audit who holds All Extended Rights on computer objects, since that right includes LAPS password reads.
