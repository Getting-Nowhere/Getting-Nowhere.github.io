---
layout: page
title: "PATH Abuse"
subtitle: "Hijacking command lookup through writable or relative PATH entries"
permalink: /methodology/privesc-linux/path-abuse/
---

The `PATH` environment variable lists the directories the shell searches, in order, when a command is typed without an absolute path. If a privileged process or a script run by a privileged account resolves a command through a `PATH` entry the attacker can write to, the attacker controls which program runs. This page covers how to find such entries and how to decide whether they matter.

## Workflow

1. Read the `PATH` of the current account.
2. Identify relative entries (such as `.`) and empty entries.
3. Check each directory for write permission.
4. Find privileged processes or scripts that call commands by name.
5. Confirm the hijack with a harmless marker before relying on it.

## Step 1: Read PATH

```bash
echo $PATH
env | grep PATH
```

Typical output:

```text
/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games
```

Each colon-separated entry is a directory. An empty entry, a `.`, or a relative path such as `bin` is a problem because it resolves against the current directory.

## Step 2: Check the permissions of each entry

```bash
for d in ${PATH//:/ }; do ls -ld "$d" 2>/dev/null; done
```

Look for entries that are writable by the current user or by a group the user belongs to. A writable directory high in the list (before `/usr/bin`) is the most useful, because a file placed there is found before the system copy.

## Step 3: Understand where PATH is trusted

PATH abuse matters only when a more privileged context uses it. Check these:

```bash
sudo -l
cat /etc/crontab
ls -la /etc/cron.*
grep -rn "PATH" /etc/cron* 2>/dev/null
```

- A `sudo` rule that allows a command without its absolute path can run a copy placed in a writable directory, subject to sudo's `secure_path` setting and `env_keep` configuration.
- A cron job that calls a command by name uses the cron `PATH`, which is often shorter than an interactive one. Check whether it includes a writable directory.
- A root-run script that calls `cat`, `tar` or `cp` without an absolute path inherits whatever `PATH` it was started with.

## Step 4: Test a harmless marker

Before using PATH abuse, confirm the mechanism with a benign command that writes a marker. Example pattern:

```bash
mkdir -p /tmp/pathtest
printf '#!/bin/sh\necho "PATH lookup reached this directory"\n' > /tmp/pathtest/ls
chmod +x /tmp/pathtest/ls
PATH=/tmp/pathtest:$PATH ls
```

The output confirms that the shell found the copy in the first directory. Only after a successful test should a target-specific payload be considered, and only within the rules of engagement.

## What to look for

| Finding | Risk |
|---|---|
| `.` or an empty entry in the PATH of a root-run process | Command hijack from any working directory |
| Writable directory listed before `/usr/bin` | Early lookup of attacker-controlled binaries |
| `sudo` rule that names a command without a full path | Hijack through a writable directory in the sudo user's PATH |
| Root cron job calling commands by name | Hijack if the cron PATH includes a writable directory |

## Pitfalls

- Interactive PATH settings differ from the PATH used by cron, systemd units and sudo. Test in the right context.
- Shell builtins (such as `cd`) and aliases are not affected by PATH, so do not mistake them for a hijack.
- Removing a planted file afterwards is part of the cleanup. Record every file placed and remove it.

## Defense

- Do not put `.` or empty entries in the PATH of any account, especially root.
- Keep directories in PATH owned by root and not writable by others.
- Use absolute paths in cron jobs, systemd units, sudoers entries and scripts.
- Set `secure_path` in sudoers so that sudo uses a fixed, trusted PATH.
- Audit PATH with the same tooling used for other world-writable checks. See [Prevention and hardening](/methodology/privesc-linux/prevention/).
