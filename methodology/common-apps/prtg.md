---
layout: page
title: "PRTG Network Monitor"
subtitle: "Identifying the PRTG web console, checking default and weak logons, and abusing a notification command injection"
permalink: /methodology/common-apps/prtg/
---

PRTG Network Monitor is agentless monitoring software. It discovers devices across a network and collects bandwidth, uptime and sensor data over ICMP, SNMP, WMI and NetFlow. Its administrative console is a web application, and the console often runs with high privileges on a Windows host. This page covers discovery, version confirmation, credential checks, and the notification command injection that affects older releases.

## Discovery

PRTG usually listens on web ports such as 80, 443 and 8080. A full port scan with version detection shows the banner:

```bash
sudo nmap -sV -p- --open -T4 TARGET_IP
```

An `Indy httpd` service on TCP 8080 identified as Paessler PRTG is the typical signature.

## Version confirmation

The console embeds its version in its pages. Fetch the index page and search for it:

```bash
curl -s http://TARGET_IP:8080/index.htm -A "Mozilla/5.0 (compatible; MSIE 7.01; Windows NT 5.0)" | grep -i version
```

Compare the version string with the vendor advisories before deciding which issues apply.

## Credential checks

1. Test the vendor default credentials for the console. Screenshot tools such as EyeWitness sometimes display them.
2. If the defaults fail, run a small spray of common passwords against the console login, observing any lockout behaviour.
3. Record every successful logon and the account's privilege level.

In the notes, the default account failed, but a common weak password succeeded for an administrative user.

## Notification command injection

The notes describe an authenticated command injection in the notification feature of older PRTG releases. The `Parameter` field of an EXECUTE PROGRAM notification is passed to a PowerShell script without sanitisation. The notes state it affects versions below 18.2.39, and the advisory for the affected version is CVE-2018-9276.

Exploitation path through the console:

1. Open Setup, then Account Settings, then Notifications.
2. Choose Add new notification, tick EXECUTE PROGRAM, and select the bundled demo script as the program file.
3. In the parameter field, enter a benign value followed by a separator and the command. The separator is a semicolon in the notes.
4. Save the notification and select Test. The console confirms the notification is queued.

```text
test.txt;COMMAND_TO_RUN
```

The notes used the injected command to create a local administrator account. In a real assessment, prefer an action that leaves no change, such as a file written to a known path or a callback to an approved listener, and record it for cleanup.

Confirm the result from the attack host:

```bash
netexec smb TARGET_IP -u USERNAME -p PASSWORD
```

A `Pwn3d!` marker on the SMB line confirms local administrator access.

> A notification can be scheduled. This is a persistence mechanism, and it is worth reporting. Remove any notification you created, and reset any account changes once the test is complete.
{: .warning }

## What to look for

- The console version below the affected release, and any unpatched components.
- Default or weak logons for the console.
- The service account under which PRTG runs. Its privilege determines the impact of command execution.
- Stored credentials for SNMP, WMI or other devices, which PRTG keeps to poll them. These can open other systems.

## Pitfalls

- Version strings in the page can differ from the installed build. Confirm the version through the console's About page where possible.
- A successful test notification confirms queuing only. Verify the effect on the host.

## Defense and prevention

Keep PRTG current, and change the default password before deployment. Restrict the console to a management network. Use a dedicated least-privilege service account for the monitoring service, and review notification and schedule configurations for unexpected commands. See the [application hardening](/methodology/common-apps/prevention/) page.
