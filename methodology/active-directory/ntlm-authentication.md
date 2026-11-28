---
layout: page
title: "NTLM Authentication"
subtitle: "Challenge-response protocols, hash formats, and pass-the-hash validation"
permalink: /methodology/active-directory/ntlm-authentication/
---

LM and NT are hash algorithms. NTLMv1 and NTLMv2 are challenge-response protocols built on those hashes. A captured NT hash can often be used directly to authenticate, which makes NTLM material a primary target in almost every AD assessment.

## Protocol comparison

| Protocol | Cryptography | Mutual authentication | Message content | Trusted third party |
|---|---|---|---|---|
| NTLM | Symmetric key | No | Random challenge | Domain controller |
| NTLMv1 | Symmetric key | No | MD4-based hash and random challenge | Domain controller |
| NTLMv2 | Symmetric key with HMAC-MD5 | No | Hash, client and server challenges | Domain controller |
| Kerberos | Symmetric and asymmetric | Yes | Encrypted tickets | Domain controller (KDC) |

## Hash types

### LM hash

- Passwords are limited to 14 characters.
- The password is split into two seven-character halves, each used as a DES key. Shorter passwords are padded with NULL values.
- LM hashes can be turned off by Group Policy.

### NT hash

NTLM is a three-message exchange: NEGOTIATE_MESSAGE from the client, CHALLENGE_MESSAGE from the server, and AUTHENTICATE_MESSAGE back from the client. NT hashes are stored in the local SAM database on a workstation or server, and in NTDS.dit on a domain controller.

A dumped account line has this shape:

```text
USERNAME:500:LM_HASH:NTLM_HASH:::
```

The fields are the account name, the RID (500 is the built-in Administrator), the LM hash, and the NT hash.

### NTLMv1 (Net-NTLMv1)

The server sends an 8-byte random challenge, and the response is built by encrypting that challenge with DES keys derived from the LM and NT hashes. Because it depends on both hashes, a captured NTLMv1 response is comparatively easy to crack. It is typically captured through poisoning or relay.

### NTLMv2 (Net-NTLMv2)

NTLMv2 adds a client challenge and a timestamp, and derives its response with HMAC-MD5 from the NT hash, user name, and domain. It is harder to replay or spoof than NTLMv1, but a captured NTLMv2 response still allows offline cracking. Use hashcat mode 5600 for captured NetNTLMv2 hashes.

### Domain cached credentials

Domain-joined hosts cache the last ten domain logons in the registry SECURITY hive, under the Cache key. These cannot be used for pass-the-hash, and they are slow to crack.

```text
$DCC2$10240#USERNAME#CACHED_HASH
```

## Pass-the-hash workflow

1. Obtain an NT hash from SAM, an NTDS.dit dump, or a poisoning capture.
2. Validate it against in-scope hosts with one authentication attempt per host.
3. Treat a Pwn3d! result as local administrator on that host, then move on to remote execution.

```bash
crackmapexec smb TARGET_IP -u USERNAME -H NTLM_HASH
```

> crackmapexec, also available as NetExec, reports a Pwn3d! marker when the hash grants administrative access. A plain success means the credential is valid but not privileged.
{: .info }

## What to look for

- The same local administrator NT hash accepted on several hosts
- Systems that still accept NTLMv1 or store LM hashes
- Captured NetNTLMv2 responses, which must be cracked or relayed because they cannot be passed

## Pitfalls

- NTLMv2 responses and cached credentials cannot be used as hashes. They require cracking.
- A successful check with one account says nothing about any other account.
- Failed attempts count toward account lockout, so validate each hash once.

## Defense

- Disable LM hash storage through Group Policy.
- Use LAPS so each host has a unique, rotating local administrator password. One stolen hash then does not open every host on the subnet.
- Place sensitive administrative accounts in the Protected Users group, which adds protection against credential theft.
