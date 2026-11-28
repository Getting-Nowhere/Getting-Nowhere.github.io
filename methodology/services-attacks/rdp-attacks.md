---
layout: page
title: "RDP Attacks"
subtitle: "Password attacks and session abuse against Remote Desktop Protocol"
permalink: /methodology/services-attacks/rdp-attacks/
---

Remote Desktop Protocol (RDP) gives graphical remote access to Windows systems and listens on TCP 3389 by default. Authentication is by username and password, so the main attack is guessing or spraying credentials. Once an attacker has SYSTEM rights on the host, RDP also offers session hijacking, and when Restricted Admin mode is enabled, it accepts pass-the-hash logons.

## Workflow

1. Confirm that TCP 3389 is open and identify the Windows host.
2. Build a username list from SMB, LDAP or other enumeration.
3. Read the lockout policy, then spray a small number of passwords.
4. With valid credentials, check local administrator membership.
5. If SYSTEM is available, consider session hijacking of other logged-on users.
6. If a NTLM hash is available and Restricted Admin is enabled, log on with the hash.

## Password attacks

```bash
crowbar -b rdp -s TARGET_IP/32 -U users.txt -c 'PASSWORD'
hydra -L usernames.txt -p 'PASSWORD' TARGET_IP rdp
```

Crowbar tests one password against a list of users. Hydra can run the same spray or a full list of username and password pairs. Keep the attempt rate low and the list short.

## Session hijacking

Session hijacking requires SYSTEM privileges. It lets the attacker attach to another user's active session without knowing their password, using `tscon.exe`.

```cmd
sc.exe create SERVICE_NAME binpath= "cmd.exe /k tscon TARGET_SESSION_ID /dest:rdp-tcp#13"
net start SERVICE_NAME
```

The service runs as Local System, so the `tscon` command executes with SYSTEM rights. Find the target session ID first with `query session` and replace `rdp-tcp#13` with the session name of the attacker's own RDP session.

## Pass the hash over RDP

```bash
xfreerdp /v:TARGET_IP /u:USERNAME /pth:NTLM_HASH
```

Restricted Admin mode must be enabled on the target for this logon to succeed. If the client reports that the feature is not enabled, an administrator can set the `DisableRestrictedAdmin` value to `0` under `HKLM\System\CurrentControlSet\Control\Lsa`.

```cmd
reg add HKLM\System\CurrentControlSet\Control\Lsa /t REG_DWORD /v DisableRestrictedAdmin /d 0x0 /f
```

> Changing this registry value is a configuration change on the target. Record it in the engagement log and revert it when testing ends.
{: .info }

## What to look for

- RDP exposed to the internet or to user subnets.
- Accounts that are members of the local Administrators or Remote Desktop Users groups.
- Disconnected sessions belonging to other users, which can be hijacked from SYSTEM.
- Restricted Admin mode enabled on hosts that also hold cached administrator hashes.

## Pitfalls

- Repeated failures lock accounts. Confirm the threshold and observation window first.
- Session hijacking fails if the target session ID or the session name is wrong.
- Pass the hash fails silently when Restricted Admin is disabled. Check the registry before trying.

> Network Level Authentication, account lockout and restricting RDP to management networks are the most effective controls against these attacks.
{: .tip }

## Defense and prevention

Limit RDP exposure through firewalls or a gateway, require Network Level Authentication, enforce a lockout policy, use multi-factor authentication for remote logons, and leave Restricted Admin disabled unless it is needed. See the [services prevention](/methodology/services-attacks/prevention/) page.
