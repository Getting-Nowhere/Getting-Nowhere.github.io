---
layout: page
title: "Credential Hunting"
subtitle: "Locating passwords, keys and tokens left on a Linux host"
permalink: /methodology/privesc-linux/credential-hunting-linux/
---

Credentials are one of the most reliable escalation paths on Linux. Passwords left in configuration files, shell history, backups and web roots are often valid for other local accounts, for databases, or for administrative services. This page covers where to look, the commands to search, and how to decide whether a finding is useful.

## Workflow

1. Search the web root and application directories.
2. Search configuration files and backups by name.
3. Read user history, environment variables and SSH material.
4. Check databases, mail and spool directories.
5. Test each credential against the most privileged account first.

## Step 1: Web root and application configuration

The `/var` tree usually holds the web root. Application configuration files frequently contain database credentials.

```bash
ls -la /var/www/ /var/www/html/
grep -RIn "DB_USER\|DB_PASSWORD" /var/www/ 2>/dev/null
grep -RIn -i "password\|passwd\|secret\|token" /var/www/ 2>/dev/null
```

A common example is the database user and password in a WordPress `wp-config.php`. Note the database host and any reuse of the same password for system accounts.

## Step 2: Search configuration and backup files by name

```bash
find / ! -path "*/proc/*" -iname "*config*" -type f 2>/dev/null
find / -type f \( -name "*.bak" -o -name "*.old" -o -name "*.backup" -o -name "*~" \) 2>/dev/null
find / -type f \( -name "*.conf" -o -name "*.config" -o -name "*.xml" \) -readable 2>/dev/null
```

Configuration files in `.conf`, `.config` and `.xml` formats commonly hold usernames, passwords, API keys and connection strings. Backup copies of configuration files are often less protected than the original.

## Step 3: Shell history and user files

```bash
cat ~/.bash_history
ls -la /home/*/
find /home -name ".bash_history" -readable 2>/dev/null
find /home -name "config.json" -readable 2>/dev/null
```

Users pass passwords as command-line arguments (for example to database clients or `curl`). Check the history of every readable account, not only your own, and look for git repositories and scripts that contain secrets.

## Step 4: Environment variables and process arguments

```bash
env
find /proc -name cmdline -exec cat {} \; 2>/dev/null | tr " " "\n" | grep -i "pass\|token\|key"
```

Environment variables for services, cron jobs and login sessions can contain secrets. Process command lines show credentials that a program received as arguments, and are visible to every local user.

## Step 5: SSH keys and known hosts

```bash
ls -la ~/.ssh
find / \( -name "id_rsa" -o -name "id_ecdsa" -o -name "id_ed25519" \) 2>/dev/null
cat ~/.ssh/known_hosts
```

A private key without a passphrase is directly usable. The `known_hosts` file lists systems the user has connected to, which gives the next lateral movement targets. Cross-reference those hosts with the ARP cache from enumeration.

## Step 6: Databases, mail, spool and system files

```bash
ls -la /var/mail /var/spool 2>/dev/null
find / \( -name "*.db" -o -name "*.sqlite" \) 2>/dev/null
ls -l /etc/shadow /etc/passwd
grep -v "^#" /etc/fstab
```

- A readable `/etc/shadow` yields password hashes for offline cracking.
- Hashes stored directly in `/etc/passwd` (uncommon, but seen on embedded devices and routers) are readable by everyone.
- Credentials in `/etc/fstab` mount options (for example a CIFS `credentials=` file) can be read and reused.

## Step 7: Passive traffic capture

If an unprivileged user can run a packet capture tool (`tcpdump`, or a capture-capable binary), cleartext credentials and authentication hashes may be visible on the wire. Tools mentioned in the notes for this purpose are `net-creds` and `Pcredz`. Capture only on hosts and networks within the engagement scope.

## What to look for

- Usernames paired with passwords in a single file.
- Credentials that match a local account name (test them with `su` or `ssh` only within scope).
- Private keys owned by root or by a more privileged user.
- Backups of `/etc`, web roots, or home directories in world-readable locations.

## Pitfalls

- A found password is not automatically valid. Verify it once against the intended account, then stop guessing.
- Lockout policies apply to local accounts too. Do not spray credentials.
- Output from `grep -r` over `/` is large and noisy. Scope the search to likely directories first.
- Record the file path and the line, but mask the secret value in the report.

## Defense

- Keep secrets out of configuration files that are readable by other users. Use file modes of `600` or `640` with an appropriate owner.
- Use a secrets manager or environment injection with restricted scope rather than hard-coded values.
- Clear shell history for interactive sessions that take credentials, and prefer prompts or stdin over command-line arguments.
- Rotate any credential that has been found in a readable location.
- Avoid reusing the same password across system, database and application accounts.
