---
layout: page
title: "Kerberos Double Hop"
subtitle: "Why a remote session cannot query the domain, and how to work around it"
permalink: /methodology/active-directory/kerberos-double-hop/
---

The double-hop problem appears when you authenticate to one host and then need that host to authenticate you to a second resource, usually a domain controller. Kerberos does not forward your credentials for you. Once you log on to the first host over WinRM with Kerberos, the session holds only the ticket for that host, and any query that needs a second Kerberos hop fails. Tools such as PowerView then return errors that look like network or permission problems, but the cause is the authentication chain.

## Why it happens

- A Kerberos ticket is not a password. It is a signed statement from the KDC about what the account may access.
- When you connect to a host with WinRM and network authentication, your TGT is not sent to the remote session. The host receives only a service ticket for itself.
- With a password logon, the NT hash is stored in the session, so the host can reuse it for the next hop. A Kerberos or network logon does not store it.
- Unconstrained delegation usually avoids the problem. The user's TGT is sent with the request, so the server can request tickets for the next host.

## Scenario

- The attack host is not joined to the domain.
- You have credentials for a domain user who is a member of the Remote Management Users group on DEV01.
- You connect to DEV01 with Evil-WinRM and try to run PowerView against DC01.
- The query fails, because the DC cannot identify you on DEV01's behalf.

Running `klist` on DEV01 shows only a ticket for that host, not a TGT that could be used for the DC.

## Workflow

1. Confirm the symptom: a query from an interactive remote session fails with an operations or directory error.
2. Check the cached tickets with `klist`. If the only ticket is for the current host, you have the double-hop problem.
3. Choose a workaround from the list below.
4. Check the result, and note any change you made to the host.

## Workaround 1: Pass a PSCredential to each query

Create a credential object and pass it to each PowerView call. The query then authenticates to the DC with the stored credentials instead of relying on the session ticket.

```powershell
$SecPassword = ConvertTo-SecureString 'PASSWORD' -AsPlainText -Force
$Cred = New-Object System.Management.Automation.PSCredential('DOMAIN\USERNAME', $SecPassword)
Get-DomainUser -SPN -Credential $Cred | select samaccountname
```

This is the simplest option, and it works from Evil-WinRM. The password is held in memory on the host, so treat that host as exposed.

## Workaround 2: Register a session configuration that runs as the account

From a Windows attack host with an elevated PowerShell console, register a session configuration that runs as the account. A session opened through it gets a TGT that can reach the DC.

```powershell
Register-PSSessionConfiguration -Name SESSION_NAME -RunAsCredential DOMAIN\USERNAME
Restart-Service WinRM
Enter-PSSession -ComputerName TARGET_HOST -Credential DOMAIN\USERNAME -ConfigurationName SESSION_NAME
```

After the session starts, `klist` shows a TGT for the account, and PowerView queries against the DC succeed.

## Limits of the workarounds

- Registering a configuration needs a GUI and an elevated PowerShell console. It does not work from Evil-WinRM, because the credential prompt cannot appear.
- The notes could not get this method to work from PowerShell on Linux attack hosts, because of how PowerShell on Linux handles Kerberos credentials.
- `RunAs` configurations weaken the security boundary between sessions, and any user who connects to that endpoint runs as the account. Remove the configuration when you finish.

> If unconstrained delegation is enabled on the target server, the double-hop problem usually does not occur, because the server receives the user's TGT. That is a finding in its own right, since unconstrained delegation lets the server reuse any TGT that is sent to it.
{: .info }

## What to look for

- Failed directory queries from remote sessions, with `klist` showing only the current host
- Servers with unconstrained delegation, which change the authentication model
- Session configurations registered on hosts that should not have them

## Pitfalls

- Do not assume the failure means lack of permissions. Check `klist` first.
- A credential object in memory is a secret. Clear the session when you finish.
- A registered session configuration persists after the session ends. Remove it.

## Defense

The notes do not list specific mitigations for the double hop. The practical controls are:

- Restrict unconstrained delegation to the hosts that need it, and review delegation settings regularly.
- Use separate administrative accounts for remote management, so the account that logs on to a host is not the one with domain-wide rights.
- Remove session configurations that run as a user account, and monitor for new ones.
