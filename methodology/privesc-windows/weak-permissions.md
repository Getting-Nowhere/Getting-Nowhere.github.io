---
layout: page
title: "Weak Permissions"
subtitle: "Find services, binaries, registry keys and autorun entries that unprivileged users can modify"
permalink: /methodology/privesc-windows/weak-permissions/
---

Weak permissions are misconfigurations in which an unprivileged user can change something that a privileged process later runs or loads. The usual targets are service binaries, service configuration, service registry keys and autorun entries. These checks are cheap, reliable and often overlooked, so they belong early in the OS-level phase.

## Concept

A Windows service runs with the account configured for it, which is often LocalSystem. The service's binary path and its registry configuration determine what runs at start. If a user can write to the binary, or can modify the service configuration to point to a different binary, the next start of the service runs code of the user's choosing with the service's privileges.

## Workflow

### 1. Automated audit

SharpUp (from the GhostPack suite) reports modifiable services and other common misconfigurations:

```powershell
PS C:\htb> .\SharpUp.exe audit
```

Treat the output as a list of leads to verify manually, not as a result.

### 2. Permissions on service binaries

```powershell
PS C:\htb> icacls "C:\PATH\TO\SERVICE.exe"
```

Look for Everyone, BUILTIN\Users or Authenticated Users with (F), (M) or (W) rights on the binary or on its folder. If the folder is writable, a file can be replaced even when the original is locked.

### 3. Permissions on service configuration

```cmd
C:\htb> accesschk.exe /accepteula -quvcw SERVICE_NAME
```

Flags: -q omits the banner, -u suppresses errors, -v is verbose, -c names the service and -w shows only objects with write access. A principal holding SERVICE_ALL_ACCESS or SERVICE_CHANGE_CONFIG can change the service's binary path. Check membership in local administrators before testing, since the answer changes what the test proves.

```cmd
C:\htb> sc qc SERVICE_NAME
C:\htb> sc query SERVICE_NAME
```

### 4. Unquoted service paths

If a service path contains spaces and is not quoted, Windows tries each space-delimited prefix as an executable. A writable folder early in that sequence can allow a planted binary to run. Searching for this pattern:

```cmd
C:\htb> wmic service get name,displayname,pathname,startmode | findstr /i "auto" | findstr /i /v "c:\windows\\" | findstr /i /v """
```

The `wmic` command is deprecated on current Windows builds. Use `Get-CimInstance Win32_Service` where available. Creating files in the drive root or in Program Files normally requires administrator rights, so this issue is less often exploitable than it looks.

### 5. Registry ACLs on services

```cmd
C:\htb> accesschk.exe /accepteula "USERNAME" -kvuqsw hklm\System\CurrentControlSet\services
```

A key with KEY_ALL_ACCESS or write access held by a low-privileged account allows its ImagePath to be changed. Changing ImagePath is the registry equivalent of replacing the binary path, and it is confirmed by restarting the service.

### 6. Autorun entries

```powershell
PS C:\htb> Get-CimInstance Win32_StartupCommand | select Name, command, Location, User | fl
```

Check whether each referenced binary or the folder it sits in is writable. A writable autorun target runs at the next logon of the affected user, or at the next boot for machine-wide entries.

## Changing a service safely

When a weak service configuration is confirmed and testing is authorised:

1. Record the original binary path with sc qc and keep a backup of the original binary.
2. Change the path or replace the binary with a test payload agreed with the client.
3. Start or restart the service and capture the result.
4. Restore the original path or binary, and verify the service runs normally with sc query.

```cmd
C:\htb> sc config SERVICE_NAME binPath= "C:\PATH\TO\ORIGINAL.exe"
C:\htb> sc query SERVICE_NAME
```

> A service that fails to start after a binary path change may still have executed the command before it timed out (error 1053). Do not treat the error as a failed test, and do not leave a changed service in place.
{: .warning }

## What to look for

- Writable service binaries or folders, with the service set to start automatically.
- Service configuration that a low-privileged group can change.
- Writable service registry keys.
- Unquoted paths in a folder that a user can write to.
- Autorun targets that users can overwrite.

## Pitfalls

- Services that do not restart on demand cannot be triggered by the current user, so the escalation waits for a reboot.
- Changing a service's configuration or binary breaks it if the cleanup is skipped. Always record the original state first.
- Antivirus and EDR often quarantine replaced service binaries.
- Permission inheritance can make a folder writable even when the file itself is not. Check both.

## Defense

Grant service administration only to administrators, and set service ACLs with the minimum rights required. Quote all service paths. Restrict write access to program folders and to service registry keys. Audit service binaries and autorun entries with file integrity monitoring, and review the output of audit tools such as SharpUp on a schedule.
