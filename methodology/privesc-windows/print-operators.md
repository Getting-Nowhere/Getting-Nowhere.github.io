---
layout: page
title: "Print Operators"
subtitle: "Use the driver-loading right of Print Operators to run code as SYSTEM, and the limits of that route"
permalink: /methodology/privesc-windows/print-operators/
---

Print Operators manage printers. On a domain controller the group also grants local logon, shutdown rights, and `SeLoadDriverPrivilege`. That last right lets the holder load and unload device drivers. If a signed but vulnerable driver is already present on disk, a member can register it and load it, then use its functionality to run code in kernel context. This page describes the class of attack, how to check exposure, and why it works on some builds and not on others.

## Step 1: Confirm the group and the privileges

```cmd
whoami /groups
whoami /priv
```

The group membership must include Print Operators. The privilege list may show `SeLoadDriverPrivilege` as `Disabled`, which is a normal state for an unelevated token.

```text
Privilege Name                Description                       State
============================= ================================= ========
SeMachineAccountPrivilege     Add workstations to domain        Disabled
SeLoadDriverPrivilege         Load and unload device drivers    Disabled
SeShutdownPrivilege           Shut down the system              Disabled
```

## Step 2: Get an elevated token if needed

If `SeLoadDriverPrivilege` is absent from an unelevated token, UAC is filtering it. Bypass UAC in the approved way, or open an administrative prompt with the group member's credentials, and then re-check `whoami /priv`. The UAC pages in this section cover the options.

## Step 3: Enable the privilege

The privilege is disabled until a process calls the Windows API to enable it. Use a maintained tool that performs the enable step, or a token-adjustment script. Confirm the state afterwards:

```cmd
whoami /priv
```

`SeLoadDriverPrivilege` must now show `Enabled`.

## Step 4: Register and load the driver

Driver loading needs a service-style registry entry. The notes describe a registry entry created under the current user hive, pointing to the driver file through an NT object path, and marking it as a kernel driver. A loader tool then calls the load routine.

Check whether the driver is already loaded before doing anything else. A driver listing tool such as DriverView makes this simple:

```cmd
DriverView.exe /stext drivers.txt
findstr /i "<driver name>" drivers.txt
```

Automated loaders wrap the enable, registry and load steps into a single command. The notes show a loader that takes a service key path and the driver path.

> The HKCU route described in the notes stopped working in Windows 10 version 1803. Test on the target build before relying on this path.
{: .warning }

## Step 5: Use the driver

Vulnerable drivers that expose a shellcode-execution interface can be used with a matching exploit tool. The tool runs code at SYSTEM level when the driver is loaded. The notes suggest changing the launched binary to a reverse shell when no GUI is available. Keep the payload to the agreed scope.

## What to look for

- Non-administrator accounts in Print Operators on a domain controller.
- `SeLoadDriverPrivilege` in the token, enabled or enable-able.
- Vulnerable signed drivers present in writable or accessible folders, such as `C:\Tools`.
- Build numbers that still allow the HKCU driver registration.

## Pitfalls

- Loading a driver that is not signed or is blocked by Driver Signature Enforcement, HVCI or Vulnerable Driver Blocklist fails. Check the build and the policy first.
- A driver crash can take down the host. Use this route only where the engagement allows the risk.
- Antivirus and EDR products increasingly block known vulnerable drivers. A blocked load gives a clear failure, not a silent one.
- Clean up the registry entry after the test, and remove any dropped driver file.

## Defense

Keep Print Operators limited to print administration, and do not allow it to log on to domain controllers. Enable the Vulnerable Driver Blocklist and HVCI where supported. Restrict who can load drivers with the "Load and unload device drivers" policy. Monitor for new driver service registrations and for `NtLoadDriver` calls from user-level processes.
