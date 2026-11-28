---
layout: page
title: "Remote Password Attacks"
subtitle: "Guessing, spraying and stuffing credentials against live network services"
permalink: /methodology/passwords/remote-password-attacks/
---

Remote password attacks submit guesses to a running service such as WinRM, SSH, RDP or SMB. They confirm that a credential is valid and often reveal the access level it grants. The main variants are targeted guessing against one account, password spraying with one password across many accounts, credential stuffing with leaked username and password pairs, and testing default credentials. Choose the variant according to the policy and the evidence available.

## Choosing a variant

| Variant | Input needed | Lockout risk | Typical use |
|---------|--------------|--------------|-------------|
| Targeted guessing | One username, candidate passwords | High | Single high-value account with a known policy |
| Password spraying | Many usernames, one or two passwords | Low when paced | Broad testing across a domain or subnet |
| Credential stuffing | Leaked username:password pairs | Moderate | Reusing breached credentials |
| Default credentials | Product or vendor name | Low | Devices and appliances with factory accounts |

## Workflow

1. Confirm the lockout threshold, observation window and password policy.
2. Build the username list from SMB, LDAP, mail or OSINT enumeration.
3. Test the default credentials of any identified product.
4. Spray one or two passwords across the username list at a paced rate.
5. Stuff leaked pairs only if they are in scope and the data source is authorized.
6. Check every valid credential for administrative access.

## Service commands

```bash
netexec winrm TARGET_IP -u USERLIST -p PASSLIST
evil-winrm -i TARGET_IP -u USERNAME -p 'PASSWORD'
hydra -L USERLIST -P PASSLIST ssh://TARGET_IP
hydra -L USERLIST -P PASSLIST rdp://TARGET_IP
hydra -L USERLIST -P PASSLIST smb://TARGET_IP
netexec smb TARGET_IP -u USERNAME -p 'PASSWORD' --shares
```

WinRM uses TCP 5985 for HTTP and 5986 for HTTPS. A successful NetExec login with an administrative marker suggests that command execution is possible for that account. Evil-WinRM then opens a PowerShell session over the PowerShell Remoting Protocol.

SSH uses asymmetric keys for authentication in addition to passwords, so a password guess is only one route. Hydra supports SSH, RDP and SMB modules for guessing.

## Spraying and stuffing

```bash
netexec smb SUBNET -u USERLIST -p 'PASSWORD'
hydra -C user_pass.list ssh://TARGET_IP
```

The first command sprays one password across a subnet. The second tries each `username:password` pair from a file, which is the credential stuffing form. Hydra's `-C` option expects colon-separated pairs.

## Default credentials

Many routers, appliances, databases and management consoles ship with factory accounts. Check the product's documentation and vendor default credential references, and compare the results with the target's model and firmware version. Default accounts that remain active are a critical finding even when they grant limited access.

## What to look for

- Valid logins that return an administrative or code-execution marker.
- Shares readable with a low-privilege account.
- Factory accounts still enabled on network devices.
- Repeated login success for the same password across accounts, which indicates reuse.

## Pitfalls

- Spraying too fast triggers lockout and alerting. Pace attempts and stay below the threshold.
- A login success can be followed by a lockout when a later spray pass retries the same account.
- Hydra's default attempt rate can exceed the service's capacity. Reduce threads when the service stops responding.

> Confirm the lockout policy before the first attempt. A spray that locks out production accounts is an incident, not a finding.
{: .danger }

## Defense and prevention

Enforce long, unique passwords, deploy multi-factor authentication on remote services, configure a lockout threshold with a sensible observation window, detect spraying patterns, and remove factory accounts. See the [password prevention](/methodology/passwords/prevention/) page.
