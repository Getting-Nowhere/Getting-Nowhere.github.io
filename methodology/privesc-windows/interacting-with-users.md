---
layout: page
title: "Interacting with Users"
subtitle: "Capture credentials and hashes from user activity, and abuse writable locations and user-triggered actions"
permalink: /methodology/privesc-windows/interacting-with-users/
---

Some of the most productive escalation paths involve the user rather than the operating system. When a person logs on, opens a share, or runs an application, the system performs authentication, executes files or writes data. This page covers passive capture of that activity, process monitoring, user-triggered execution in writable locations, and the use of hash capture through file-based triggers.

## Workflow

### 1. Passive traffic capture

If Wireshark is installed, an unprivileged user may be able to capture traffic, because the option to restrict the Npcap driver to administrators is not enabled by default. A capture on a shared workstation can reveal cleartext protocols such as FTP.

From an attacker-controlled host on the same segment, a capture tool such as tcpdump or Wireshark can be used. net-creds can extract passwords and hashes from a live interface or from a saved pcap.

```bash
sudo tcpdump -i INTERFACE -w capture.pcap
```

### 2. Process command-line monitoring

Scheduled tasks and logon scripts often pass credentials on the command line. A short polling loop can compare the command lines of running processes over time and show new ones:

```powershell
PS C:\htb> Get-CimInstance Win32_Process | Select-Object CommandLine
```

Repeat the query every few seconds and diff the output. New entries show commands that were started during the observation window.

### 3. Vulnerable applications in writable locations

Some applications load helper files or executables from a folder that they expect to be trusted. If the folder allows write access to Users, any authenticated user can place a file there. Check the ACL:

```cmd
C:\htb> icacls "C:\PATH\TO\APP_FOLDER"
```

Look for BUILTIN\Users or Everyone with write or modify rights. Such a folder is a candidate for an application-specific privilege escalation, once the application's startup behaviour is understood. Docker Desktop, for example, has been affected by a writable helper directory.

### 4. Hash capture through file triggers

When a user opens a folder that contains a shell command file (.scf) or a shortcut (.lnk) whose icon points to a UNC path, Windows Explorer attempts to authenticate to that path. If an attacker-controlled SMB listener receives the connection, an NTLMv2 challenge response can be captured and cracked or relayed.

```powershell
PS C:\htb> $objShell = New-Object -ComObject WScript.Shell
```

Responder can listen for these requests on the attacker interface:

```bash
sudo responder -I INTERFACE -wrf
```

Place the file in a share that users open often. An `@` prefix in the file name tends to keep it at the top of the folder listing, where it is seen first.

> File-based hash capture requires writing to a share that users open. Confirm that the file drop is authorised, and remove the file after the test.
{: .warning }

## What to look for

- Plaintext credentials in process command lines or capture data.
- Writable application folders, especially those loaded by services or scheduled tasks.
- Shares and folders that users open frequently and that accept new files.
- Outbound SMB or NTLM traffic from user workstations to untrusted hosts.

## Pitfalls

- Passive capture on shared workstations raises privacy concerns. Limit the capture scope and handle the data according to the rules of engagement.
- Polling process lists is noisy in some environments and can miss short-lived processes. Choose the polling interval deliberately.
- Modern Windows versions have reduced the effectiveness of SCF files. Shortcut files are the usual replacement, but results vary by build.
- Hashes captured this way may be NTLMv2 challenge responses that need cracking. Cracking is offline and time-consuming.

## Defense

Restrict Npcap and packet capture to administrators. Block outbound SMB and NTLM authentication from user workstations to external or untrusted addresses, and enforce SMB signing. Keep credentials off the command line by using prompts, managed identities or credential stores. Set writable permissions on application folders to administrators only, and audit writes to shares that users open frequently.
