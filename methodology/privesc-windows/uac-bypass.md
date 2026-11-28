---
layout: page
title: "UAC Bypass"
subtitle: "Confirm User Account Control settings and the token state before looking for an elevation path"
permalink: /methodology/privesc-windows/uac-bypass/
---

User Account Control (UAC) separates an administrator's normal, filtered token from the elevated token used for administrative actions. When a member of the Administrators group runs as a standard user, processes start with the filtered token, and elevation needs a consent prompt. A UAC bypass is any technique that causes an auto-elevating process to run with the elevated token without that prompt. This page covers how to confirm the situation and what a bypass exploits, at the level needed to check exposure and defend against it.

## Concept

- Applications have integrity levels. Standard processes run at medium integrity, and elevated processes at high integrity.
- An administrator account gets two tokens at logon: a filtered medium-integrity token and a full high-integrity token.
- The built-in Administrator account (RID 500) does not receive a filtered token, so its processes run at high integrity by default.
- UAC behaviour is governed by policy settings, configured in secpol.msc or pushed by Group Policy.

## Workflow

### 1. Confirm the token and group membership

```cmd
C:\htb> whoami /groups
C:\htb> net localgroup administrators
```

If the current user is in Administrators but whoami /groups shows the group without the Enabled attribute, or the process is medium integrity, the session is running with the filtered token.

### 2. Confirm UAC is enabled

```cmd
C:\htb> REG QUERY HKLM\Software\Microsoft\Windows\CurrentVersion\Policies\System /v EnableLUA
```

EnableLUA set to 0x1 means UAC is on. A value of 0x0 means UAC is off, and the filtered token problem does not apply.

### 3. Check the prompt level

```cmd
C:\htb> REG QUERY HKLM\Software\Microsoft\Windows\CurrentVersion\Policies\System /v ConsentPromptBehaviorAdmin
```

| Value | Meaning |
|---|---|
| 0x0 | Elevate without prompting |
| 0x2 | Prompt for consent on the secure desktop (Always notify) |
| 0x5 | Prompt for consent for non-Windows binaries (default) |

A value of 0x0 means no prompt at all. At 0x2 the consent prompt applies to more processes, which leaves fewer bypass paths. At the default 0x5, Windows binaries that are set to auto-elevate run without a prompt, and that is the condition most bypasses exploit. The source notes describe 0x5 as "Always notify"; that label belongs to 0x2.

### 4. Check the OS build

```powershell
PS C:\htb> [environment]::OSVersion.Version
```

UAC bypass techniques depend on specific builds, because auto-elevating binaries change between releases. The UACME project catalogues bypasses by build number and technique. Match the build to the catalogue before testing anything.

### 5. Check the DLL search path

```cmd
C:\htb> cmd /c echo %PATH%
```

Some auto-elevating binaries load a DLL that does not exist on the system. If that DLL is searched for in a folder that the user can write to, and the folder is in PATH or in the application's own directory, the auto-elevating process may load attacker-supplied code at high integrity. The DLL search order is described on the DLL injection page.

## What to look for

- EnableLUA enabled and ConsentPromptBehaviorAdmin at its default or lower.
- Current user in Administrators with a medium-integrity process.
- A build listed in UACME for a technique whose preconditions are present.
- A user-writable folder that appears in PATH ahead of system folders.

## Pitfalls

- Bypass techniques are build-specific. A method that works on one build may do nothing on the next, and some change behaviour after a patch.
- Pending Windows Update activity can change the behaviour of update-related binaries.
- Many bypasses leave artefacts, such as new DLLs in the user's PATH folders or registry entries. Clean them up after testing.
- Bypass tooling is widely signatured. Expect detection and plan for it with the client.

## Defense

Keep UAC enabled with the consent prompt at the default level or higher, and run administrators with separate standard accounts for daily use. Restrict write access to folders that appear in PATH, and keep the system PATH free of user-writable locations. Apply vendor patches promptly, since many bypasses are fixed in cumulative updates. Monitor for auto-elevating binaries that start from unusual parent processes or load DLLs from user folders.
