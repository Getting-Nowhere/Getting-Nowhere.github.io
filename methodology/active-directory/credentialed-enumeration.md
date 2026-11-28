---
layout: page
title: "Credentialed Enumeration"
subtitle: "Mapping users, groups, shares, trusts, and attack paths once you hold any valid domain credential"
permalink: /methodology/active-directory/credentialed-enumeration/
---

With one valid domain account, the attack surface opens up. Any authenticated user can query most of the directory, read the SYSVOL share, and list groups and computers. Credentialed enumeration answers three questions: who is privileged, where that privilege sits, and which paths lead to it. Run the same questions from Linux and from Windows where you can, because each host reveals different data.

Confirm the credential with one authentication attempt first, and record the account's bad password count so you do not lock it out.

## Enumeration from Linux

### NetExec (formerly CrackMapExec)

```bash
sudo crackmapexec smb DC_IP -u USERNAME -p PASSWORD --users
sudo crackmapexec smb DC_IP -u USERNAME -p PASSWORD --groups
sudo crackmapexec smb TARGET_IP -u USERNAME -p PASSWORD --loggedon-users
sudo crackmapexec smb DC_IP -u USERNAME -p PASSWORD --shares
sudo crackmapexec smb DC_IP -u USERNAME -p PASSWORD -M spider_plus --share 'SHARE_NAME'
```

The `--users` output includes `badpwdcount`, which is useful before any spraying. `spider_plus` searches a share recursively and writes JSON output.

### SMBMap

```bash
smbmap -u USERNAME -p PASSWORD -d DOMAIN -H DC_IP
smbmap -u USERNAME -p PASSWORD -d DOMAIN -H DC_IP -R 'SHARE_NAME' --dir-only
```

### rpcclient

```bash
rpcclient -U "" -N DC_IP
```

Inside the session, `enumdomusers` lists users with their RIDs, and `queryuser` returns details for one RID. A null session may fail on hardened domains.

### Impacket remote shells

```bash
psexec.py DOMAIN/USERNAME:PASSWORD@TARGET_IP
wmiexec.py DOMAIN/USERNAME:PASSWORD@TARGET_IP
```

`psexec.py` uploads a randomly named service executable to ADMIN$ and returns a SYSTEM shell over a named pipe. `wmiexec.py` runs each command through WMI as the authenticated user and generates fewer artefacts, though it is still logged (for example as event 4688).

### windapsearch

```bash
python3 windapsearch.py --dc-ip DC_IP -u USERNAME@DOMAIN -p PASSWORD --da
python3 windapsearch.py --dc-ip DC_IP -u USERNAME@DOMAIN -p PASSWORD -PU
```

`--da` lists Domain Admins members. `-PU` searches recursively for privileged users, which catches nested membership.

### BloodHound

```bash
sudo bloodhound-python -u 'USERNAME' -p 'PASSWORD' -ns DC_IP -d DOMAIN -c all
sudo neo4j start
```

Load the output into BloodHound and run **Find shortest paths to Domain Admins**. The result lists the users, groups, hosts, ACLs, and GPOs that form a route to Domain Admin.

## Enumeration from Windows

### Active Directory PowerShell module

```powershell
Import-Module ActiveDirectory
Get-ADDomain
Get-ADUser -Filter {ServicePrincipalName -ne "$null"} -Properties ServicePrincipalName
Get-ADTrust -Filter *
Get-ADGroup -Filter * | Select-Object name
Get-ADGroupMember -Identity "Backup Operators"
```

Using the built-in module is often quieter than loading a third-party tool into memory.

### PowerView and SharpView

| Function | Purpose |
|---|---|
| `Get-DomainUser` | Users and their attributes |
| `Get-DomainGroupMember -Recurse` | Group members, including nested groups |
| `Get-DomainTrustMapping` | Trust map across reachable domains |
| `Get-NetSession` | Sessions on a host, to find where admins are logged on |
| `Test-AdminAccess` | Whether the current user is local admin on a host |
| `Find-LocalAdminAccess` | Hosts where the current user is local admin |
| `Find-InterestingDomainAcl` | Objects whose ACLs grant rights to non-built-in principals |
| `Get-DomainPolicy` | Default domain and DC policies, including password policy |

```powershell
Import-Module .\PowerView.ps1
Get-DomainGroupMember -Identity "Domain Admins" -Recurse
Get-DomainTrustMapping
Test-AdminAccess -ComputerName TARGET_HOST
Get-DomainUser -SPN -Properties samaccountname, ServicePrincipalName
```

SharpView is a .NET port of PowerView with many of the same functions.

### Shares and sensitive files

```powershell
.\Snaffler.exe -s -d DOMAIN -o snaffler.log -v data
```

Snaffler enumerates hosts, then their readable shares, and reports likely credentials, SSH keys, and configuration files. The `data` verbosity shows only the findings.

### SharpHound

```powershell
.\SharpHound.exe -c All --zipfilename OUTPUT_NAME
```

Run it as a domain user from a host inside the network. Load the zip into BloodHound. Useful built-in queries include unsupported operating systems and computers where domain users are local admin.

## What to look for

- Accounts in privileged groups, including nested ones.
- Service accounts with SPNs. Feed them into [Kerberoasting](/methodology/active-directory/kerberoasting/).
- Hosts where your account is local admin, or where Domain Users has local admin.
- Trusts and their direction. See [Domain Trusts](/methodology/active-directory/domain-trusts/).
- Any credentials in shares, scripts, or descriptions.

## Pitfalls

- A large BloodHound collection is noisy. Choose collection methods that match the rules of engagement.
- Results from one credential reflect only that account's view. Re-check important findings with a second account where possible.
- Enumeration itself leaves logs. Record your queries as well as your findings.

## Defense

Limit what authenticated users can read by reviewing ACLs and share permissions. Remove Domain Users from local admin groups. Monitor sensitive share access. See [AD Prevention](/methodology/active-directory/ad-prevention/).
