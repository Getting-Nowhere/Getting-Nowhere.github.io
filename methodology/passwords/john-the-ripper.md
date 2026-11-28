---
layout: page
title: "John the Ripper"
subtitle: "Cracking modes, hash identification, format conversion and file-to-hash helpers"
permalink: /methodology/passwords/john-the-ripper/
---

John the Ripper is an offline password cracker that supports a very wide range of hash formats. It is especially useful when a hash comes from a file, archive or key that needs a conversion step before cracking, because it ships with helpers that extract a crackable hash from common file types. This page covers the three cracking modes, how to identify formats, and the conversion helpers.

## Identify the hash

```bash
hashid -j HASH
```

Adding `-j` makes `hashid` print the John format name for the hash. Use that name with `--format=` when John cannot detect the type on its own.

## Cracking modes

1. Single crack mode generates candidates from the username and GECOS fields in the password file. It is most useful against Linux credentials:

```bash
john --single passwd
```

2. Wordlist mode tests each word from a file. The hashes must be in plain text with one hash per line. Add `--rules` to apply John's built-in mutation rules or a custom rule set:

```bash
john --wordlist=WORDLIST HASH_FILE
john --wordlist=WORDLIST --rules HASH_FILE
```

3. Incremental mode generates candidates from a statistical model (Markov chain) over a character set:

```bash
john --incremental HASH_FILE
```

Show results for a hash file with `--show`:

```bash
john HASH_FILE --show
```

## Common formats

The full format list is long. The table shows formats that are frequently useful in these assessments.

| Format | Example option | Used for |
|--------|----------------|----------|
| `nt` | `--format=nt` | Windows NT hashes |
| `netntlmv2` | `--format=netntlmv2` | Captured NetNTLMv2 challenge responses |
| `raw-md5` | `--format=raw-md5` | Unsalted MD5 |
| `mssql` | `--format=mssql` | MS SQL password hashes |
| `mysql-sha1` | `--format=mysql-sha1` | MySQL SHA1 hashes |
| `krb5` | `--format=krb5` | Kerberos 5 hashes |
| `lm` | `--format=LM` | LAN Manager hashes from older systems |
| `ssh` | `--format=ssh` | SSH keys |

## File-to-hash helpers

Helpers extract a crackable hash from an encrypted file. The output goes into a file that John then cracks.

| Helper | Input |
|--------|-------|
| `ssh2john` | SSH private keys |
| `zip2john` | ZIP archives |
| `rar2john` | RAR archives |
| `pdf2john` | PDF documents |
| `office2john` | Microsoft Office documents |
| `keepass2john` | KeePass databases |
| `pfx2john` | PKCS#12 files |
| `keychain2john` | macOS keychain files |
| `truecrypt_volume2john` | TrueCrypt volumes |
| `putty2john` | PuTTY private keys |
| `wpa2john` | WPA and WPA2 handshakes |

```bash
ssh2john.py KEY_FILE > key.hash
john --wordlist=WORDLIST key.hash
john key.hash --show
```

## What to look for

- A `--show` line that pairs a file or account with its plaintext password.
- Formats that John detects with a warning. Verify the format manually.
- Hashes from the same source sharing a password, which suggests reuse.

## Pitfalls

- Hash extraction and cracking are separate steps. A helper that prints nothing or an error usually means the file is not in the expected format.
- Single mode depends on the GECOS field, so the `passwd` file must contain it.
- Wordlist files must be plain text. Compressed lists need decompression first.

> Keep the original encrypted file and its extracted hash together in the engagement folder so that results can be reproduced.
{: .info }

## Defense and prevention

Protect encrypted files with long, unique passwords, avoid storing SSH keys without a passphrase, and use key-management tooling for sensitive archives. See the [password prevention](/methodology/passwords/prevention/) page.
