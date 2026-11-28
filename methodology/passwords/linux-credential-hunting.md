---
layout: page
title: "Linux Credential Hunting"
subtitle: "Searching files, history, logs, memory and browser stores for credentials on Linux"
permalink: /methodology/passwords/linux-credential-hunting/
---

On Linux, almost everything is a file, and credentials end up in many of them: configuration files, scripts, database dumps, notes, shell history, scheduled jobs and logs. Credentials also remain in memory and in browser stores after use. Credential hunting on a Linux host is a systematic search across these sources, starting with the files most likely to contain plaintext values and moving to memory and application stores.

## Workflow

1. Search for configuration files, databases and notes in the user's home directory and common application paths.
2. Search for scripts and scheduled jobs that may contain embedded credentials.
3. Review shell history and log files for commands that include passwords.
4. Check memory and browser stores when root access or the user's session is available.
5. Test each recovered credential against the services in scope.

## Files

```bash
for l in $(echo ".conf .config .cnf"); do echo -e "\nFile extension: $l"; find / -name "*$l" 2>/dev/null | grep -v "lib\|fonts\|share\|core"; done
for i in $(find / -name "*.cnf" 2>/dev/null | grep -v "doc\|lib"); do echo -e "\nFile: $i"; grep "user\|password\|pass" $i 2>/dev/null | grep -v "\#"; done
for l in $(echo ".sql .db .*db .db*"); do echo -e "\nDB File extension: $l"; find / -name "*$l" 2>/dev/null | grep -v "doc\|lib\|headers\|share\|man"; done
find /home/* -type f -name "*.txt" -o ! -name "*.*"
for l in $(echo ".py .pyc .pl .go .jar .c .sh"); do echo -e "\nFile extension: $l"; find / -name "*$l" 2>/dev/null | grep -v "doc\|lib\|headers\|share"; done
```

Configuration files usually use the `.conf`, `.config` or `.cnf` extensions. Notes are often plain `.txt` or have no extension. Scripts can contain credentials in variables or command lines and are worth reading in full.

## Scheduled jobs

```bash
cat /etc/crontab
ls -la /etc/cron.*/
```

Cron entries reveal commands that run as root or another account, sometimes with passwords as arguments. Check whether the scripts they call are writable by a lower-privileged user, which would also be a privilege escalation path.

## History and logs

```bash
tail -n5 /home/*/.bash*
```

Shell history, `.bashrc` and `.bash_profile` can contain commands with inline passwords. Logs record authentication events, sudo use and account changes:

```text
/var/log/auth.log     Debian-family authentication events
/var/log/secure       RedHat-family authentication events
/var/log/syslog       general system activity
/var/log/faillog      failed login attempts
/var/log/mysqld.log   MySQL server events
```

```bash
for i in $(ls /var/log/* 2>/dev/null); do GREP=$(grep "accepted\|session opened\|session closed\|failure\|failed\|ssh\|password changed\|new user\|delete user\|sudo\|COMMAND\=" $i 2>/dev/null); if [[ $GREP ]]; then echo -e "\n#### Log file: $i"; grep "accepted\|session opened\|session closed\|failure\|failed\|ssh\|password changed\|new user\|delete user\|sudo\|COMMAND\=" $i 2>/dev/null; fi; done
```

## Memory

Many desktop and service processes keep credentials in memory after login. Mimipenguin extracts clear-text values from memory for GNOME keyring entries and similar sources, and it requires root:

```bash
sudo python3 mimipenguin.py
```

## Browser stores

Firefox stores saved logins in `logins.json` within the profile directory. The file is encrypted, so the list of sites is visible, but recovering the values requires the profile key. Locate the active profile first:

```bash
ls -l .mozilla/firefox/ | grep default
cat .mozilla/firefox/PROFILE/logins.json | jq .
```

## What to look for

- `password=`, `passwd`, `secret` or `token` strings in configuration and script files.
- Database files in application directories, which may hold user tables.
- Commands in history that include inline credentials, such as database clients or `sshpass`.
- Failed-login entries that contain a password typed into the username field.

## Pitfalls

- A recursive search from `/` produces large output. Narrow the scope to likely directories first.
- Many matches are library or documentation files. Exclude them to focus the review.
- Memory extraction on a production host changes its state and needs explicit approval.

> Confirm that each recovered credential is in scope before testing it against a service.
{: .info }

## Defense and prevention

Remove plaintext credentials from configuration and history, restrict log and history permissions, avoid inline secrets in cron jobs and scripts, use a secrets manager, and restrict root access to memory. See the [password prevention](/methodology/passwords/prevention/) page.
