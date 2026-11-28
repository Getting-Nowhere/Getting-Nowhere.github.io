---
layout: page
title: "Enumeration"
subtitle: "Identity, environment and system-state checks to run before any exploit"
permalink: /methodology/privesc-linux/enumeration/
---

Enumeration is where most escalation paths are found. Helper scripts such as LinPEAS and LinEnum are useful, but manual checks should come first so that you understand each result and can explain it in a report. This page covers the core checks in the order to run them.

## Workflow

1. Orient yourself: who you are, where you are, and what the host is.
2. Read the account data: users, groups, home directories and shells.
3. Read the system state: processes, sockets, scheduled work and installed software.
4. Search the filesystem: writable locations, configuration files, history files and mounts.
5. Record everything, then move to the phase that matches the strongest lead.

## Step 1: Situational awareness

```bash
whoami
id
hostname
ip a
cat /etc/os-release
uname -a
echo $PATH
env
cat /etc/shells
lsblk
cat /etc/fstab
route -n
arp -a
cat /etc/resolv.conf
```

`id` shows group membership, which matters more than the username. Groups such as `sudo`, `docker`, `lxd`, `disk` and `adm` each grant a different path (see [privileged groups](/methodology/privesc-linux/privileged-groups/)). The kernel build from `uname -a` is needed later, but it should not drive the first decisions.

## Step 2: Users, groups and home directories

```bash
cat /etc/passwd
cut -d: -f1 /etc/passwd
grep "sh$" /etc/passwd
cat /etc/group
getent group sudo
ls -la /home
lastlog
w
```

Login shells on accounts show who can actually log in. Check each home directory for readable history files, configuration files and `.ssh` directories.

Password hashes can appear in several places. The prefix identifies the algorithm:

| Prefix | Algorithm |
|---|---|
| `$1$` | MD5-crypt |
| `$5$` | SHA-256 |
| `$6$` | SHA-512 |
| `$2a$` or `$2y$` | bcrypt |
| `$7$` | scrypt |
| `$argon2i$` or `$argon2id$` | Argon2 |

A readable `/etc/shadow` or a hash inside `/etc/passwd` is a finding in itself, and an offline cracking candidate.

## Step 3: Processes, services and sockets

```bash
ps aux | grep root
ps au
find /proc -name cmdline -exec cat {} \; 2>/dev/null | tr " " "\n"
ss -tlnp
```

What to look for:

- Services running as root that the current user can influence (configuration, sockets, scripts).
- Processes whose command lines contain passwords or tokens.
- Terminal multiplexers such as `tmux` or `screen` owned by other users.

## Step 4: Installed software and binaries

```bash
apt list --installed 2>/dev/null | tr "/" " " | cut -d" " -f1,3 | sed 's/[0-9]://g' | tee installed_pkgs.list
sudo -V | head -n1
ls -l /bin /usr/bin /usr/sbin
```

Compare installed binaries against the [GTFOBins](https://gtfobins.github.io/) index. Any binary listed there is worth checking under sudo, SUID and capability conditions. Record the versions of `sudo`, `polkit` (`pkexec`), `screen`, `logrotate` and the kernel, because each has public advisories.

## Step 5: Filesystem: writable locations and configuration

```bash
find / -path /proc -prune -o -type d -perm -o+w 2>/dev/null
find / -path /proc -prune -o -type f -perm -o+w 2>/dev/null
find / -type f \( -name "*.conf" -o -name "*.config" \) -exec ls -l {} \; 2>/dev/null
find / -type f -name "*.sh" 2>/dev/null | grep -v "src\|snap\|share"
find / -type f \( -name "*_hist" -o -name "*_history" \) -exec ls -l {} \; 2>/dev/null
ls -l /tmp /var/tmp /dev/shm
find / -name ".*" -type f -exec ls -l {} \; 2>/dev/null | grep "$(whoami)"
```

The last command lists hidden files owned by the current account. Hidden files and directories are also worth reviewing under `/home` and `/opt`.

Check each world-writable result: is it a script, a library, a configuration file, or a directory that a root process writes into? Scripts that root runs on a schedule are the highest-value finding.

## Step 6: Cron, mounts and unmounted drives

```bash
ls -la /etc/cron.daily/ /etc/cron.hourly/ /etc/cron.weekly/
cat /etc/crontab
df -h
```

If an unmounted filesystem or extra drive is present and root access is obtained, mounting it may expose backups or credentials. Read `/etc/fstab` for mount options and credentials.

## What to look for

| Signal | Why it matters | Next page |
|---|---|---|
| `NOPASSWD` in `sudo -l` | Direct path to root or another user | [Sudo rights abuse](/methodology/privesc-linux/sudo-rights-abuse/) |
| Writable script run by root | Code runs with root rights | [Cron job abuse](/methodology/privesc-linux/cron-job-abuse/) |
| User in `docker` or `lxd` | Equivalent to root | [Privileged groups](/methodology/privesc-linux/privileged-groups/) |
| Writable PATH directory | Command hijack for other users | [PATH abuse](/methodology/privesc-linux/path-abuse/) |
| Readable history with passwords | Direct credential reuse | [Credential hunting](/methodology/privesc-linux/credential-hunting-linux/) |

## Pitfalls

- A command that is missing from the target does not mean the feature is absent. Use the tool that is present.
- Enumeration output is only as good as the account used. Results from a service account differ from results from an interactive user.
- Large `find` output with `2>/dev/null` hides permission errors. Run a narrower search when a broad one is noisy.
- Do not change files while enumerating. Reads only, until a path is confirmed.

## Defense

Reduce what low-privileged users can see and write: restrict `/home` permissions, keep history files out of readable locations, remove unused binaries and packages, and audit world-writable paths on a schedule. See [Prevention and hardening](/methodology/privesc-linux/prevention/).
