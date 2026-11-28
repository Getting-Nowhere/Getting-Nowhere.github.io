---
layout: page
title: "Wildcard Abuse"
subtitle: "How shell globbing in privileged scripts turns file names into command options"
permalink: /methodology/privesc-linux/wildcard-abuse/
---

The shell expands a wildcard such as `*` into the list of matching file names before the command runs. A command that receives those names as arguments may treat a name that begins with a hyphen as an option. If a root-run script uses a wildcard in a directory that a low-privilege user can write to, the attacker can create file names that act as options for that command. This page covers how to recognise the pattern, how to find it, and how to fix it.

## Workflow

1. Find scheduled or privileged scripts that use wildcards.
2. Check whether the directory the wildcard expands in is writable by the current user.
3. Read the command's man page for options that accept file names or run actions.
4. Confirm with a harmless file name that the option is interpreted.
5. Report the finding with the fix, not the payload.

## Wildcard characters

| Character | Meaning |
|---|---|
| `*` | Any number of characters |
| `?` | Exactly one character |
| `[ ]` | One character from the set, or a range with `-` |
| `~` | Home directory, or `~user` for another account |

## Step 1: Find wildcards in privileged code

```bash
grep -rn "\*" /etc/crontab /etc/cron.* /var/spool/cron 2>/dev/null
find / -type f -name "*.sh" 2>/dev/null | xargs grep -ln "tar \|chown \|chmod \|rsync \|zip " 2>/dev/null
```

Typical risky patterns are archive commands (`tar`, `zip`, `rsync`) and ownership or permission changes (`chown`, `chmod`) run with a wildcard over a directory that users can write to.

## Step 2: Confirm the directory is writable

```bash
ls -la /path/to/directory
```

A wildcard over a directory the current user cannot write to cannot be used this way, because file names cannot be created in it. Check the directory owner, its mode and any ACLs.

## Step 3: Check the command's options

The issue depends on the command. For `tar`, options exist that run an action at a checkpoint, and the file name that matches a wildcard can be read as one of those options. The general method is:

```bash
man tar | less
tar --help | grep -i "checkpoint\|exec\|action"
```

Look for options that accept a file name as input, run an external command, or change behaviour on a checkpoint. Document the option name in the report. Do not reproduce a full working payload in the report.

## Step 4: Confirm the behaviour without modifying the target

Confirm the pattern before relying on it, using only read operations on the target:

- Watch the job run (for example with pspy) and note the exact command line, the working directory and the owner of the process.
- List the directory the wildcard expands in, and note which names the job would pass to the command.
- Reproduce the command's parsing in a scratch directory that you own, using names that the command documents as options, and observe the output. Do not write into the target directory.

Escalation through this pattern is only in scope when the engagement rules allow changes to the target, and any such change must be reverted.

## What to look for

- A root-run script that archives or changes ownership of a directory that users can write to.
- A cron job that runs a wildcard command every minute, as the timing makes it easy to observe.
- A command with options that can run another program or change its behaviour at runtime.
- Repeated evidence that the script runs (new archive files appearing at intervals).

## Pitfalls

- A file name that begins with `-` is interpreted as an option by most commands. Files named `-n`, `--help` and similar can be created by anyone who can write the directory.
- Shell globbing does not match hidden files (names beginning with `.`) unless the pattern includes them, so results can differ between tests and real runs.
- Some scripts quote the wildcard or use `find`, which avoids the issue. Read the exact line before concluding.
- Remove test files after the test. A test file left in a directory a cron job reads can change that job's behaviour.

## Defense

- Use `--` to end option parsing before wildcard expansion, where the command supports it.
- Prefix wildcards with `./` so that file names cannot begin with a hyphen (`./*` instead of `*`).
- Do not run archive or ownership changes over directories writable by lower-privileged users.
- Write privileged output to a root-owned directory, and use `find` with `-print0` and `xargs -0` where the task allows.
- Review cron jobs for wildcards during each configuration audit. See [Cron job abuse](/methodology/privesc-linux/cron-job-abuse/) and [Prevention and hardening](/methodology/privesc-linux/prevention/).
