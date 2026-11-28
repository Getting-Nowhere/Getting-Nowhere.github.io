---
layout: page
title: "Living Off the Land in AD"
subtitle: "Built-in Windows tools for mapping a domain when you cannot upload anything"
permalink: /methodology/active-directory/living-off-the-land-ad/
---

Sometimes you cannot load PowerView, BloodHound, or any other tool onto a host. The client may block downloads, the host may be monitored closely, or you may have only a shell. Built-in Windows features such as cmd, PowerShell, WMI, `net`, and `dsquery` can still answer most early questions about the host, the network, and the domain. The output is rougher than dedicated tooling, but every command is a normal administrative action, so it is easier to explain in a report and harder to flag as an attack.

## Workflow

1. Identify the host, its patch level, and its environment.
2. Check whether other people are working on the same host.
3. Map the network position so you know which segments and domains are reachable.
4. Query the domain with WMI, `net`, and `dsquery`.
5. Log every command and its output, because you will need them for the report and for cleanup.

## Step 1: Host and environment

| Command | Result |
|---|---|
| `hostname` | The computer name |
| `[System.Environment]::OSVersion.Version` | OS version and revision level |
| `wmic qfe get Caption,Description,HotFixID,InstalledOn` | Installed patches and hotfixes |
| `ipconfig /all` | Adapter state and addressing, which gives you the local segment |
| `echo %USERDOMAIN%` | The domain the host belongs to (cmd) |
| `echo %logonserver%` | The DC the host last logged on against (cmd) |

`systeminfo` returns most of this in one command.

## Step 2: PowerShell basics

```powershell
Get-Module
Get-ExecutionPolicy -List
Set-ExecutionPolicy Bypass -Scope Process
Get-ChildItem Env: | ft Key,Value
Get-Content $env:APPDATA\Microsoft\Windows\Powershell\PSReadline\ConsoleHost_history.txt
```

`Set-ExecutionPolicy ... -Scope Process` changes the policy only for the current process, so the host is left as it was. The PowerShell history file is worth reading because a user may have typed a password or a path to a script that contains one.

## Step 3: Am I alone on this host?

```powershell
qwinsta
```

Check the session list before you act. An active console or RDP session belonging to another user means that person may notice your activity. Coordinate with the client or wait.

## Step 4: Network position

| Command | Use |
|---|---|
| `arp -a` | Hosts this machine has recently talked to |
| `route print` | Known networks and routes, useful for pivot planning |
| `netsh advfirewall show allprofiles` | Whether the host firewall is filtering traffic |

## Step 5: WMI

```powershell
wmic ntdomain get Caption,Description,DnsForestName,DomainName,DomainControllerAddress
wmic useraccount list /format:list
wmic group list /format:list
wmic process list /format:list
```

The `ntdomain` query is especially useful. It lists the local domain, its DCs, and any trusted domains or forests the host can see. In one assessment it showed a child domain and an external forest, which set up the trust work later.

## Step 6: net commands

| Command | Information |
|---|---|
| `net accounts /domain` | Password and lockout policy |
| `net group "Domain Admins" /domain` | Members of Domain Admins |
| `net group "Domain Controllers" /domain` | DC computer accounts |
| `net user USERNAME /domain` | Details for one account |
| `net user /domain` | All domain accounts |
| `net view /domain` | Hosts in the domain |
| `net view \\TARGET_HOST /ALL` | Shares on one host |

`net` commands are common EDR triggers, so run only the queries you need.

## Step 7: dsquery and LDAP filters

```powershell
dsquery user
dsquery computer
dsquery * "CN=Users,BASE_DN"
dsquery * -filter "(&(objectCategory=person)(objectClass=user)(userAccountControl:1.2.840.113556.1.4.803:=32))" -attr distinguishedName userAccountControl
dsquery * -filter "(userAccountControl:1.2.840.113556.1.4.803:=8192)" -limit 5 -attr sAMAccountName
```

The `1.2.840.113556.1.4.803` matching rule means "all bits in this value must match". The value `32` is `PASSWD_NOTREQD` and `8192` is `SERVER_TRUST_ACCOUNT`, which is how domain controllers appear. The `1.2.840.113556.1.4.804` rule matches any bit, and `1.2.840.113556.1.4.1941` follows group membership. Logical operators `&`, `|`, and `!` combine criteria.

## What to look for

- The domain name, DC addresses, and any trusted domains from the `ntdomain` query
- Local administrators and privileged group members
- Patch level, which can point to later exploitation options
- Other sessions on the host and the routes to other segments

## Pitfalls

- Output from `net` and `wmic` is text, so filter it before you pass it on. Copy the exact output into your notes.
- A query that returns nothing may mean the filter is wrong or that access is restricted. Confirm with a second method.

> Living off the land keeps your footprint small, but it does not remove your footprint. Every command still runs under your account and may appear in logs.
{: .info }

## Defense

- Enable PowerShell script block logging. Commands typed in a session are recorded in the PowerShell Operational log, so a session is visible even when the commands are built-in.
- Remove the PowerShell 2.0 engine where it is not needed. Older versions do not record script block logs, so a downgrade is a logging gap.
- Restrict `net` and `dsquery` use to administrators and monitor for unusual bursts of directory queries.
