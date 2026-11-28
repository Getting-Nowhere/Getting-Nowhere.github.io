---
layout: page
title: "Linux Authentication Process"
subtitle: "How PAM, passwd, shadow and opasswd store Linux credentials and how to crack them"
permalink: /methodology/passwords/linux-authentication-process/
---

Linux authenticates users through Pluggable Authentication Modules (PAM). The modules that check passwords, such as `pam_unix.so`, read account data from `/etc/passwd` and password hashes from `/etc/shadow`, and they keep old password hashes in `/etc/security/opasswd` to prevent reuse. Understanding these files shows where hashes live, who can read them, and which permission mistakes expose them.

## Components

- PAM modules, usually `pam_unix.so` or `pam_unix2.so`, are located in `/usr/lib/x86_64-linux-gnu/security/` on Debian-family systems. They handle authentication, sessions and password changes.
- `/etc/passwd` lists every account and is readable by all users.
- `/etc/shadow` holds password hashes and is readable only by privileged accounts.
- `/etc/security/opasswd` stores previous password hashes so that the PAM library can block reuse.

## /etc/passwd

```text
htb-student:x:1000:1000:,,,:/home/htb-student:/bin/bash
```

| Field | Example | Meaning |
|-------|---------|---------|
| Username | `htb-student` | Account name |
| Password | `x` | Hash stored in `/etc/shadow` |
| User ID | `1000` | Numeric user identifier |
| Group ID | `1000` | Primary group identifier |
| GECOS | `,,,` | Full name and contact fields |
| Home directory | `/home/htb-student` | Working directory |
| Shell | `/bin/bash` | Default login shell |

An `x` in the password field means the hash is in `/etc/shadow`. If the field holds a hash directly, or if the file is writable, the password can be read or replaced.

```bash
head -n 1 /etc/passwd
```

## /etc/shadow

```text
htb-student:$y$j9T$SALT...HASH:18955:0:99999:7:::
```

Shadow fields include the username, the hash, the last change date in days, the minimum and maximum password age, the warning period, the inactivity period and the expiration date. A password field that begins with `!` or `*` cannot be used for a Unix password login, but key-based or Kerberos logins may still work.

The hash format is `$ID$SALT$HASH`. The ID identifies the algorithm:

| ID | Algorithm |
|----|-----------|
| 1 | MD5 |
| 2a | Blowfish |
| 5 | SHA-256 |
| 6 | SHA-512 |
| y | yescrypt |
| 7 | scrypt |

## /etc/security/opasswd

```bash
sudo cat /etc/security/opasswd
```

The file holds previous hashes for each account. In the example format, ID `1` indicates MD5, which is much faster to crack than yescrypt or SHA-512. Old hashes can reveal the password pattern a user follows.

## Cracking Linux hashes

Combine the passwd and shadow files with `unshadow`, then crack with Hashcat mode 1800 for SHA-512 crypt hashes:

```bash
sudo cp /etc/passwd /tmp/passwd.bak
sudo cp /etc/shadow /tmp/shadow.bak
unshadow /tmp/passwd.bak /tmp/shadow.bak > /tmp/unshadowed.hashes
hashcat -m 1800 -a 0 /tmp/unshadowed.hashes WORDLIST -o /tmp/unshadowed.cracked
```

Copy the files to a working directory before processing them so that the originals are not modified. John the Ripper can read the same combined file in its own format.

> Copying `/etc/shadow` requires root, and the copy is itself sensitive. Remove the working copies when the assessment ends.
{: .warning }

## What to look for

- A writable `/etc/passwd`, which allows an attacker to add or blank a password for root.
- Hash IDs that are fast to crack, such as MD5, on accounts with privileges.
- Accounts with a usable shell and a password hash.
- Reused passwords, which show up as identical hashes after `unshadow`.

## Pitfalls

- Shadow entries with `!` or `*` cannot be cracked because no password hash exists for that login.
- Mixing data from different hosts in one `unshadow` run produces mismatched entries.
- Old hashes in `opasswd` may not match the current password. Crack them for pattern analysis, then test the current hash.

## Defense and prevention

Keep `/etc/shadow` readable only by root, use modern hashing such as yescrypt, verify the permissions of `/etc/passwd` and `/etc/shadow` in audits, and remove stale accounts. See the [password prevention](/methodology/passwords/prevention/) page.
