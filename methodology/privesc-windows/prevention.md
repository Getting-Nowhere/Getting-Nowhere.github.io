---
layout: page
title: "Prevention and Hardening"
subtitle: "Build, patch, configure, audit and log Windows hosts to remove most local privilege escalation paths"
permalink: /methodology/privesc-windows/prevention/
---

Most local privilege escalation on Windows comes from configuration, not from unpatched kernels. Unneeded privileges, weak service permissions, saved credentials and writable paths account for most paths. A consistent baseline removes the majority of them. This page collects the hardening controls that correspond to the attack pages in this section. Each control names the page that describes the attack it prevents.

## Step 1: Build from a clean image

Build each host from a known-good image, rather than from a vendor pre-install. The image should include only the applications that users need, the configuration the environment requires, and the current updates that have been tested. Clean builds make it possible to compare hosts and to rebuild a compromised system quickly.

- Install from vendor media or a deployment server, and record the build.
- Remove bloatware and unneeded software before the image is captured.
- Test the image on a small pilot group before wider rollout.

## Step 2: Patch on a managed schedule

- Use WSUS or Windows Update for Business to control the rollout.
- Restart hosts on a schedule, since some updates only take effect after a reboot.
- Retire operating systems that are out of support. See [End-of-Life Systems](/methodology/privesc-windows/end-of-life-systems/).

## Step 3: Configure with Group Policy

Group Policy applies settings centrally, both in Active Directory and on standalone hosts. Use it to enforce:

| Setting | Prevents |
| --- | --- |
| Remove SeDebugPrivilege, SeImpersonatePrivilege and SeTakeOwnershipPrivilege from non-admin accounts | [SeDebugPrivilege](/methodology/privesc-windows/sedebug-privilege/), [SeImpersonate](/methodology/privesc-windows/seimpersonate-potato/), [SeTakeOwnership](/methodology/privesc-windows/setakeownership-privilege/) |
| Restrict Load and unload device drivers to administrators | [Print Operators](/methodology/privesc-windows/print-operators/) |
| Disable AlwaysInstallElevated | [Miscellaneous Techniques](/methodology/privesc-windows/miscellaneous-techniques/) |
| Restrict file dialogs and alternative tools in kiosk sessions | [Citrix and Kiosk Breakout](/methodology/privesc-windows/citrix-breakout/) |
| Keep UAC enabled at the default consent level or higher | [UAC Bypass](/methodology/privesc-windows/uac-bypass/) |

Use the Password Policy settings under Account Policies to enforce length, history and expiry, and check that no user holds rights they do not need.

## Step 4: Manage users and privileged groups

- Limit local and domain administrator accounts on each host.
- Keep built-in operator groups empty except for named administrators. This includes Backup Operators, Server Operators, Print Operators, Event Log Readers, DnsAdmins and Hyper-V Administrators.
- Use separate standard accounts for daily work and administrative accounts for admin tasks.
- Enforce login restrictions for administrator accounts, and use two-factor authentication where the platform supports it.
- Review the rights of each account with `whoami /priv` and `whoami /groups` during audits.

## Step 5: Audit and secure permissions

- Use a recognised baseline, such as the DISA STIG for the OS version or the Microsoft Security Compliance Toolkit.
- Audit writable files and folders, service permissions and autorun entries. See [Weak Permissions](/methodology/privesc-windows/weak-permissions/).
- Keep secrets out of files, scripts and command lines. See [Credential Hunting on Windows](/methodology/privesc-windows/credential-hunting-windows/) and [Event Log Readers](/methodology/privesc-windows/event-log-readers/).
- Use Credential Guard and Device Guard where the hardware and OS support them.

An audit is not a penetration test. Use it to keep the baseline current, and combine it with vulnerability scans and hands-on testing.

## Step 6: Log what matters

- Enable process creation auditing with command line logging (event 4688) where the volume is acceptable.
- Deploy Sysmon with a tested configuration. Sysmon logs process, network, file and logon activity to the Applications and Services Logs hive.
- Send logs to a SIEM and correlate them across hosts.
- Monitor event 4672 for sensitive privileges assigned to unexpected logons.
- Add network logging, such as sensor or packet capture on the segments that carry administrative traffic.

## Key hardening measures

- Enable Secure Boot and BitLocker on every host.
- Audit writable files, directories and binaries that can launch other applications.
- Use absolute paths in scheduled tasks and service configurations that run with elevated rights.
- Do not store credentials in clear text in world-readable files, scripts or shared drives.
- Clean up home directories and PowerShell history.
- Ensure low-privileged users cannot modify libraries that programs load.
- Remove unneeded packages and services to reduce the attack surface.
- Use Group Policy to enforce configuration across the estate.

> Harden according to what the business uses and requires. A control that breaks a business process is often disabled, so test each change before wider rollout.
{: .info }

## Defense summary

Remove unneeded privileges, keep operator groups empty, patch on a schedule, lock down service and file permissions, keep secrets out of plain text, and log the activity that attackers need. Review these controls at least once a year and after any incident.
