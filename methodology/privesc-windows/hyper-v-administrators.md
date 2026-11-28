---
layout: page
title: "Hyper-V Administrators"
subtitle: "Treat virtualisation administrators as domain-level, and check the hard-link route to SYSTEM on older builds"
permalink: /methodology/privesc-windows/hyper-v-administrators/
---

Hyper-V Administrators have full control of every Hyper-V feature on the host. If a domain controller runs as a virtual machine, the account can reach that DC through its virtual disks. The group is also a local escalation path: on some builds, the Hyper-V management service restores file permissions on deleted virtual disks as SYSTEM without impersonating the user, which can be redirected with a hard link. The notes present both routes. The local route depends on the build and on the patch level.

## Step 1: Confirm the group and the host role

```cmd
whoami /groups
net localgroup "Hyper-V Administrators"
```

Check whether the host runs Hyper-V and which guests it holds:

```powershell
Get-VM
Get-VMHardDiskDrive -VMName <VM name>
```

If a guest is a domain controller, the group holder can, in principle, clone the DC and mount its disk offline. That is a domain compromise route, so confirm the scope with the client before taking it.

## Step 2: Domain controller route

Virtualisation administrators have the same practical reach as domain administrators in a virtualised DC environment. The notes describe creating a clone of the live DC, mounting its virtual disk offline, and extracting the NTDS.dit file. The hashes are then extracted offline.

> Cloning a live domain controller is a high-impact action. Discuss it with the client before attempting it, and confirm how the clone will be destroyed.
{: .danger }

## Step 3: Local SYSTEM route (build-dependent)

The notes describe the following class of attack:

1. The virtual machine management service removes the file of a deleted virtual disk and restores the original permissions as SYSTEM.
2. If the account can place a hard link in the virtual disk path that points to a protected SYSTEM file, the restore step changes permissions on that file.
3. The tester gains control of the target file, replaces it with a binary of their choosing, and starts the service that runs it.

The notes give an example target, a maintenance service installed by a third-party browser. Its binary is a protected file that a service running as SYSTEM starts. Do not reproduce exploit code from public proofs of concept. Describe the approach in the report and cite the advisory.

### Check exposure

Confirm the build and the patch level first. The notes list two CVEs for this route, CVE-2018-0952 and CVE-2019-0841. The notes report that the March 2020 updates changed the hard-link behaviour, so hosts patched beyond that point are not expected to be exposed to this route. Confirm against the vendor advisory for the build in use.

```powershell
Get-HotFix | Sort-Object InstalledOn -Descending | Select-Object -First 10
systeminfo | findstr /B /C:"OS Name" /C:"OS Version"
```

Then check for installed services that run as SYSTEM and that an unprivileged user can start:

```powershell
Get-CimInstance Win32_Service | Where-Object { $_.StartName -eq 'LocalSystem' } | Select-Object Name, PathName, StartMode
```

Any service that the user can start and whose file the user can take ownership of is a candidate. Check permissions with `icacls` before changing anything.

## What to look for

- Hyper-V Administrators membership for an account that should not hold it.
- Virtual machines that host domain controllers.
- Unpatched hosts that predate the March 2020 hard-link change.
- Startable SYSTEM services with files that a non-administrator can reach.

## Pitfalls

- Copying or cloning a virtual disk uses significant disk space and time. Check free space before starting.
- Checkpoints and differencing disks complicate offline mounts.
- Modifying a service binary breaks the service for every user of the host. Restore the original file and its permissions after the test.

## Defense

Keep Hyper-V Administrators empty except for named virtualisation administrators, and treat them as domain administrators for any virtual DC. Keep virtual DCs in a separate administrative tier. Patch the host so that the hard-link behaviour is fixed. Restrict write access to Hyper-V virtual disk folders, and audit changes to the `.vhdx` files and to service binaries.
