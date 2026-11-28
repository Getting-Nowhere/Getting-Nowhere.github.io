---
layout: page
title: "Kerberoasting"
subtitle: "Request service tickets for SPN accounts and crack them offline"
permalink: /methodology/active-directory/kerberoasting/
---

Kerberoasting targets service accounts. Any domain user can ask the KDC for a service ticket (TGS) for any SPN in the domain, and the ticket is encrypted with the NT hash of the account that runs the service. Capture the ticket, take it offline, and try to crack it. A cracked password gives you the service account, and service accounts are often members of privileged groups. Kerberoasting needs only a valid domain account, so it is a common early step in the post-compromise phase.

## Primer

- An SPN maps a service name to the account the service runs under.
- The attack works across a forest trust when Kerberos authentication is permitted across it (see [Cross-Forest Trust Abuse](/methodology/active-directory/cross-forest-trust-abuse/)).
- You need a domain account with a cleartext password or NT hash, a Kerberos ticket, or a keytab with root access on a domain-joined Linux host.
- Having an SPN does not guarantee privilege. The account may be low-value, and the password may not crack.

## Workflow

1. List accounts that have SPNs set.
2. Request TGS tickets for the accounts that look useful.
3. Convert the tickets to hashcat format.
4. Crack offline with a wordlist.
5. Validate the cracked password against the domain with one authentication.

## Step 1: From Linux

Impacket's `GetUserSPNs.py` lists SPN accounts from a non-domain-joined host, with a domain account and the DC address:

```bash
GetUserSPNs.py -dc-ip DC_IP DOMAIN/USERNAME
```

Request all tickets, or one account only, and save them:

```bash
GetUserSPNs.py -dc-ip DC_IP DOMAIN/USERNAME -request
GetUserSPNs.py -dc-ip DC_IP DOMAIN/USERNAME -request-user SPN_USER -outputfile tickets
```

Crack the ticket with hashcat mode `13100` (Kerberos 5 TGS-REP, RC4):

```bash
hashcat -m 13100 tickets /usr/share/wordlists/rockyou.txt
```

Validate the result:

```bash
sudo crackmapexec smb DC_IP -u SPN_USER -p PASSWORD
```

## Step 2: From Windows

Enumerate SPNs with the built-in tool, then filter to user accounts and ignore computers:

```cmd
setspn.exe -Q */*
```

PowerView lists the same data as objects and can export the tickets in hashcat format:

```powershell
Import-Module .\PowerView.ps1
Get-DomainUser * -spn | select samaccountname
Get-DomainUser -Identity SPN_USER | Get-DomainSPNTicket -Format Hashcat
Get-DomainUser * -SPN | Get-DomainSPNTicket -Format Hashcat | Export-Csv .\tgs.csv -NoTypeInformation
```

Rubeus is the most flexible option:

```powershell
.\Rubeus.exe kerberoast /stats
.\Rubeus.exe kerberoast /ldapfilter:'admincount=1' /nowrap
.\Rubeus.exe kerberoast /user:SPN_USER /nowrap
```

- `/stats` counts Kerberoastable accounts and their supported encryption types.
- `/ldapfilter` limits the request to a group of accounts, such as those with `admincount=1`.
- `/nowrap` keeps each hash on one line.
- `/tgtdeleg` requests RC4 only, for accounts whose encryption types are not set.

## Encryption types

Kerberoasting tools request RC4 (type 23) by default because it is weaker and faster to crack. AES tickets (types 17 and 18) are supported and are much slower to crack. The notes list hashcat mode `19700` for AES TGS-REP hashes. Check `msDS-SupportedEncryptionTypes` on the account to see which types it accepts. A value of `0` means the account falls back to RC4.

## What to look for

- Service accounts that are members of Domain Admins, directly or through nested groups
- Old service accounts with old passwords, which are more likely to crack
- Accounts that support RC4 only
- Accounts with `admincount=1`, which shows they have been or are privileged

## Pitfalls

- Expect partial results. Some tickets will not crack, and some cracked accounts will have little privilege.
- Large numbers of TGS requests from one host are visible to defenders. Request only the accounts you need.
- Cracking is offline and may not stop. Set a time limit for cracking, and record the hashes in a secure location.

## Defense

- Use managed service accounts (MSA) or group managed service accounts (gMSA), which rotate complex passwords automatically.
- For accounts that cannot be replaced, set a long, complex passphrase that does not appear in any wordlist.
- Keep service accounts out of privileged groups.
- Audit Kerberos service ticket operations through Group Policy. Look for an abnormal number of `TGS-REQ` and `TGS-REP` exchanges, and for RC4 requests in an environment that mostly uses AES.
