---
layout: page
title: "Privileged Access"
subtitle: "Find where your account can log on remotely, through RDP, WinRM, or SQL Server"
permalink: /methodology/active-directory/privileged-access/
---

Local admin rights are the strongest position on a host, but you do not always have them. Remote access groups give a different route: members of the Remote Desktop Users group can log on over RDP, members of Remote Management Users can open a PowerShell remoting session, and SQL Server sysadmins can run queries and, if configured, operating-system commands. This page covers how to find those paths and how to use them without changing more than you need.

## Workflow

1. Check which accounts you control, and which of them are in remote access groups.
2. Find hosts where those accounts can log on remotely.
3. Use BloodHound to find paths from your accounts to hosts through the `CanRDP`, `CanPSRemote`, and `SQLAdmin` edges.
4. Log on with the least privilege needed, and confirm the access level.
5. Record each session and each host you touched.

## Step 1: Find remote access groups

PowerView lists the members of a local group on a remote host:

```powershell
Get-NetLocalGroupMember -ComputerName TARGET_HOST -GroupName "Remote Desktop Users"
Get-NetLocalGroupMember -ComputerName TARGET_HOST -GroupName "Remote Management Users"
```

In the notes, the RDP group on one host included Domain Users, which meant every domain account could log on there. A finding like that matters more than any single credential.

## Step 2: Find paths in BloodHound

These queries find users with a path to a computer through a group membership, using the relevant edge:

```text
MATCH p1=shortestPath((u1:User)-[r1:MemberOf*1..]->(g1:Group)) MATCH p2=(u1)-[:CanPSRemote*1..]->(c:Computer) RETURN p2
```

```text
MATCH p1=shortestPath((u1:User)-[r1:MemberOf*1..]->(g1:Group)) MATCH p2=(u1)-[:SQLAdmin*1..]->(c:Computer) RETURN p2
```

Replace `CanPSRemote` with `CanRDP` to find RDP paths.

## Step 3: RDP

Use the account's credentials with a client that supports RDP. Keep the session short, and do not change the host's state beyond what the test needs.

## Step 4: WinRM

From a Windows host, create a PowerShell credential object and start a remoting session:

```powershell
$password = ConvertTo-SecureString "PASSWORD" -AsPlainText -Force
$cred = New-Object System.Management.Automation.PSCredential ("DOMAIN\USERNAME", $password)
Enter-PSSession -ComputerName TARGET_HOST -Credential $cred
```

From Linux, Evil-WinRM does the same job:

```bash
evil-winrm -i TARGET_IP -u USERNAME -p PASSWORD
```

WinRM sessions use network authentication, so the credentials are not cached for use on other hosts. If your next step needs the domain, see [Kerberos Double Hop](/methodology/active-directory/kerberos-double-hop/).

## Step 5: MSSQL sysadmin

Accounts with `sysadmin` on a SQL Server instance can run queries, and with `xp_cmdshell` enabled, commands on the OS. Find SQL instances from the domain with PowerUpSQL:

```powershell
Import-Module .\PowerUpSQL.ps1
Get-SQLInstanceDomain
Get-SQLQuery -Verbose -Instance "TARGET_HOST,1433" -username "DOMAIN\USERNAME" -password "PASSWORD" -query 'Select @@version'
```

From Linux, use `mssqlclient.py` with Windows authentication:

```bash
mssqlclient.py DOMAIN/USERNAME@TARGET_IP -windows-auth
```

Once connected, `enable_xp_cmdshell` turns on command execution if the account has the rights. Enabling it changes server configuration, so record it and disable it afterwards.

SQL sysadmin accounts are often service accounts, so they may be found with Kerberoasting or LLMNR poisoning (see [Kerberoasting](/methodology/active-directory/kerberoasting/)).

## What to look for

- Domain Users, or any broad group, in Remote Desktop Users or Remote Management Users
- Service accounts with sysadmin on SQL Server
- BloodHound paths that reach many computers through one group
- Hosts where your account has more than one remote route

## Pitfalls

- Remote access is not local admin. A WinRM session may have fewer rights than you expect.
- A session that looks fine may fail when you query the domain, which is the double-hop problem.
- Enabling `xp_cmdshell` or starting a session on a production server affects the system. Get approval first.

## Defense

- Remove broad groups, such as Domain Users, from Remote Desktop Users and Remote Management Users.
- Restrict logon rights for RDP and WinRM to the accounts and hosts that need them.
- Review sysadmin membership on SQL Server, and keep `xp_cmdshell` disabled unless it is required.
- Use separate administrative accounts for remote management, so a compromised day-to-day account cannot reach administrative hosts.
