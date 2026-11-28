---
layout: page
title: "Network Credential Hunting"
subtitle: "Finding credentials in SMB shares and in captured network traffic"
permalink: /methodology/passwords/network-credential-hunting/
---

Corporate file shares and network traffic are rich sources of credentials. Shares hold scripts, configuration files and spreadsheets that users have left behind, and clear text protocols expose logons to anyone who can see the packets. This page covers two complementary workflows: searching shares for credential patterns, and mining captured traffic for logons and hashes.

## Part 1: Credential hunting in network shares

Start with the shares most likely to hold secrets. IT, development, backup and deployment shares are usually more valuable than shares of images or archived marketing material. Scanning every share in a large environment can take days, so prioritise.

### Search patterns

- Keywords in content: `passw`, `user`, `token`, `key`, `secret`, and the domain prefix such as `DOMAIN\`.
- File extensions that often store credentials: `.ini`, `.cfg`, `.env`, `.xlsx`, `.ps1`, `.bat`.
- Interesting file names: `config`, `user`, `passw`, `cred`, `initial`.
- Localised terms. A German organisation may write `Benutzer` rather than `User`.

### Windows hunting

Run a recursive search from a Windows host to test a single share:

```powershell
Get-ChildItem -Recurse -Include *.ini,*.cfg,*.ps1,*.bat \\SERVER\SHARE | Select-String -Pattern "passw"
```

Snaffler, run on a domain-joined host, enumerates accessible shares and flags interesting files. Its `-u` option pulls user names from Active Directory and searches for references to them. The `-i` and `-n` options restrict which shares are searched. Its output is large, so filter it before acting on it.

PowerHuntShares runs without domain membership and writes an HTML report:

```powershell
Invoke-HuntSMBShares -Threads 100 -OutputDirectory C:\Users\Public
```

### Linux hunting

Manspider scans SMB shares remotely, using a container and a valid account:

```bash
docker run --rm -v ./manspider:/root/.manspider blacklanternsecurity/manspider TARGET_IP -c 'passw' -u USERNAME -p PASSWORD
```

NetExec can spider a share and search file contents for a pattern:

```bash
netexec smb TARGET_IP -u USERNAME -p PASSWORD --spider IT --content --pattern "passw"
```

> Limit spider runs to the shares in scope. A spider across every share in a domain generates heavy SMB traffic and can be noticed by defenders.
{: .tip }

## Part 2: Credential hunting in network traffic

Unencrypted protocols send logons in clear text or in a form that can be replayed or cracked. Where a capture exists, look for these protocols first.

| Unencrypted | Encrypted counterpart | Use |
|-------------|-----------------------|-----|
| HTTP | HTTPS | Web pages and forms |
| FTP | FTPS or SFTP | File transfer |
| SNMP | SNMPv3 with encryption | Device monitoring, community strings |
| POP3 | POP3S | Mail retrieval |
| IMAP | IMAPS | Mail access |
| SMTP | SMTPS | Mail submission |
| LDAP | LDAPS | Directory queries and binds |
| Traditional DNS | DNS over HTTPS | Name resolution |

### Wireshark filters

| Filter | Purpose |
|--------|---------|
| `http.request.method == "POST"` | Form submissions, which may carry passwords |
| `dns` | Name resolution for hosts of interest |
| `tcp.stream eq N` | Follow one conversation |
| `ip.src == ATTACKER_IP && ip.dst == TARGET_IP` | Traffic between two hosts |

### Automated extraction with Pcredz

Pcredz parses a capture and reports credentials it recognises, including FTP, POP, SMTP, IMAP and SNMP data, HTTP Basic and NTLM headers, NTLMv1 and v2 hashes from SMB, LDAP and MSSQL, and some Kerberos material:

```bash
./Pcredz -f capture.pcapng -t -v
```

Hashes from Pcredz are cracked with the modes described on the [Hashcat](/methodology/passwords/hashcat/) page. NTLMv2 captures use a different mode from NT hashes.

## What to look for

- Plain text passwords in scripts, configuration files and spreadsheets.
- Connection strings containing a domain user name and password.
- Captured FTP, POP, SMTP or HTTP Basic logons.
- SNMP community strings, which often grant read or write access to devices.

## Pitfalls

- A pattern search returns many false positives. Confirm each credential before reporting it.
- Keywords must match the target's language and naming.
- Captured traffic may hold other people's personal data. Keep only what the engagement requires.

## Defense and prevention

Remove credentials from files and shares, and keep secrets in a vault. Restrict share permissions by role, and audit shares for files containing credential patterns. Move every service from its unencrypted protocol to the encrypted counterpart in the table above, and check that the encryption is enforced rather than optional. See the [password prevention](/methodology/passwords/prevention/) page.
