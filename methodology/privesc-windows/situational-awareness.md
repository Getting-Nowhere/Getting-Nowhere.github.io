---
layout: page
title: "Situational Awareness"
subtitle: "Establish identity, privileges, network position, protections and patch level before choosing an escalation path"
permalink: /methodology/privesc-windows/situational-awareness/
---

Situational awareness is the first phase on any Windows foothold. Before running anything noisy, answer four questions: who we are, what we can reach, which defences are watching us, and which parts of the system are out of date or misconfigured. Most later decisions depend on these answers.

## Workflow

1. Identity and privileges
2. Network position
3. Protections
4. System and patch level
5. Environment and PATH
6. Processes and listening ports
7. Users and groups

### 1. Identity and privileges

```cmd
C:\htb> whoami
C:\htb> echo %USERNAME%
C:\htb> whoami /priv
C:\htb> whoami /groups
```

Record the user, every group membership and every privilege, including whether each privilege is Enabled or Disabled. A privilege shown as Disabled is held by the account but is not active in the current token, and several escalation paths in this methodology depend on that distinction.

### 2. Network position

```cmd
C:\htb> ipconfig /all
C:\htb> arp -a
C:\htb> route print
```

Look for a dual-homed host, meaning one with interfaces on more than one network. Such a host may be the pivot into another segment. The ARP cache and routing table show recent neighbours and the networks reachable from here. The DNS settings and domain information identify the domain and its controllers.

### 3. Protections

```powershell
PS C:\htb> Get-MpComputerStatus
PS C:\htb> Get-AppLockerPolicy -Effective | select -ExpandProperty RuleCollections
PS C:\htb> Get-AppLockerPolicy -Local | Test-AppLockerPolicy -Path C:\Windows\System32\cmd.exe -User Everyone
```

Check Defender status, which AppLocker rules apply, and whether a given binary is blocked for a given user. Some EDR products alert on common binaries such as net.exe and tasklist, so plan alternatives before running them.

### 4. System and patch level

```cmd
C:\htb> systeminfo
C:\htb> wmic qfe
C:\htb> tasklist /svc
```

```powershell
PS C:\htb> Get-HotFix | ft -AutoSize
PS C:\htb> Get-WmiObject -Class Win32_Product | select Name, Version
```

If systeminfo does not list hotfixes, query them through WMI or Get-HotFix. Record the OS version, build, boot time and KB list. These feed the kernel and end-of-life checks. Installed software returned by the product query often points to third-party services worth examining.

### 5. Environment and PATH

```cmd
C:\htb> set
C:\htb> cmd /c echo %PATH%
```

Note HOMEDRIVE and HOMEPATH, which often point to a file share used for roaming profiles, and any PATH folder that the current user can write to. A writable folder in PATH is a DLL search-order risk (see UAC bypass and DLL injection).

### 6. Processes and listening ports

```cmd
C:\htb> netstat -ano
C:\htb> tasklist /FI "PID eq <PID>"
```

Focus on listeners bound to 127.0.0.1 or ::1 that are not on 0.0.0.0 or the wildcard IPv6 address. Services assumed to be reachable only locally are often less hardened. Map each PID to a process and service name before deciding whether it is worth attacking (see the process communication page).

### 7. Users and groups

```cmd
C:\htb> query user
C:\htb> net user
C:\htb> net localgroup
C:\htb> net localgroup administrators
C:\htb> net accounts
```

Look for accounts that may share credentials with the current user, such as a standard account alongside an administrative twin. Review non-standard groups, since descriptions sometimes contain credentials. Read the password policy before any password guessing.

## Escalation targets

| Target | Typical context |
|---|---|
| NT AUTHORITY\SYSTEM (LocalSystem) | Runs most Windows services; more privileges than a local administrator |
| Built-in Administrator | Sometimes disabled, often reused across hosts |
| Other local account in Administrators | Same rights as the built-in administrator |
| Standard domain user in local Administrators | Credentials are not the problem; the barrier is UAC |
| Domain admin in local Administrators | Full control of the host and a path to the domain |

## What to look for

- Dangerous privileges in the token, enabled or disabled (SeImpersonate, SeDebug, SeBackup, SeTakeOwnership, SeLoadDriver).
- Third-party software, non-default services and loopback listeners.
- Writable folders in PATH.
- Builds with a missing patch.
- Accounts that look like admin twins of the current user.

> Record every command output in a notes file as you go. This keeps the attack path reproducible and gives the report an evidence trail.
{: .tip }

## Pitfalls

- Broad enumeration with tasklist, net.exe or WMI can trigger EDR alerts. Confirm the rules of engagement and prefer targeted queries.
- AppLocker may block cmd.exe or PowerShell for the user. Test before relying on a tool.
- systeminfo, WMI and Get-HotFix can disagree. Cross-check the patch list before drawing conclusions.

## Defense

Keep patch levels current, limit installed third-party software, enforce application control (AppLocker or WDAC) for non-administrative users, and enable process command-line auditing (event 4688) where the logging volume is acceptable. Keep PATH free of user-writable folders.
