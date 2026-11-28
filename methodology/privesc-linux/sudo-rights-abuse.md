---
layout: page
title: "Sudo Rights Abuse"
subtitle: "Reading sudo policy and finding commands that can be turned into a root shell"
permalink: /methodology/privesc-linux/sudo-rights-abuse/
---

`sudo` lets an administrator grant specific users the right to run specific commands as another user, usually root. The policy is held in `/etc/sudoers` and files under `/etc/sudoers.d/`. A rule that is too broad, or that allows a program with a shell escape, gives the holder a direct route to root. Because `sudo -l` requires no exploit, this is usually the first privileged check to run after identity.

## Workflow

1. List the current user's sudo rights without a password prompt where possible.
2. For each permitted command, decide whether it can run a shell or write files.
3. Check the environment rules that sudo applies (`env_reset`, `env_keep`, `SETENV`, `secure_path`).
4. Record the sudo version and check it against known advisories.
5. Use the least invasive confirmation that proves the path.

## Step 1: List sudo rights

```bash
sudo -l
sudo -l -U USERNAME
cat /etc/sudoers 2>/dev/null | grep -v "^#" | sed -r '/^\s*$/d'
ls -la /etc/sudoers.d/ 2>/dev/null
```

Example output showing a common high-risk line:

```text
User USERNAME may run the following commands on TARGET_HOST:
    (root) NOPASSWD: /usr/sbin/tcpdump
```

Read each element of the line:

| Element | Meaning |
|---|---|
| `(root)` | Target account the command runs as |
| `NOPASSWD` | No password prompt; reachable from any unattended shell |
| `SETENV` | The user may set environment variables for the command |
| `ALL` | Any command; the same as a root shell |

## Step 2: Judge each permitted command

Look up each binary on [GTFOBins](https://gtfobins.github.io/) under the sudo context. Commands in that index usually have a documented escape, such as a shell option, a command that runs an external program, or a way to write files as root.

Some commands look harmless but accept options that run another program. A command that writes output, rotates logs or runs a post-processing hook is a candidate, because the hook runs with the privileges of the sudo rule.

A sudo rule that allows a shell (`/bin/sh`, `/bin/bash`), an editor with shell escape, a package manager with hooks, or an interpreter (python, perl, ruby) gives root directly.

## Step 3: Check the environment rules

```bash
sudo -V | head -n1
sudo -l | grep -i "env_keep\|SETENV\|secure_path\|env_reset"
```

- `env_reset` clears most of the environment for sudo commands.
- `env_keep` names variables that sudo keeps. Kept variables such as `PYTHONPATH` or `LD_PRELOAD` can change how a permitted program loads code (see [shared object hijacking](/methodology/privesc-linux/shared-object-hijacking/) and [Python library hijacking](/methodology/privesc-linux/python-library-hijacking/)).
- `SETENV` lets the user set variables on the command line for that run.
- `secure_path` replaces the user's PATH with a fixed value for sudo commands. If it is absent and the rule uses a bare command name, [PATH abuse](/methodology/privesc-linux/path-abuse/) may apply.

## Step 4: Check the sudo version

```bash
sudo -V | head -n1
```

Compare the reported version with the advisories listed in the [0-day quick reference](/methodology/privesc-linux/0day-quick-reference/). Sudo versions that predate a published fix are a separate path that does not need any sudo rule.

## Step 5: Confirm the path safely

Prove the right without changing the target. For example, run the allowed command with its documented, read-only option, or list the files it can write. If the command writes output as root, check whether that output location is one the user controls, and do not overwrite system files.

## What to look for

- `NOPASSWD` on interpreters, shells, editors, archivers, package managers or network capture tools.
- Commands listed without an absolute path.
- `ALL` on the right-hand side of a rule for a single account.
- `SETENV` on any command, combined with a library-loading interpreter.
- Writable paths referenced in rules, such as scripts or directories the command reads.

## Pitfalls

- `sudo -l` shows the rules for the current user only. Use `-U` with a sufficient privilege level to see another account's rules.
- Some sudo rules require a password. Do not guess or reuse passwords outside the rules of engagement.
- A rule that allows a command with fixed arguments may not allow an escape, so test the exact form permitted.
- Escalation through a log or capture tool can leave artefacts. Note any files written and remove them afterwards.

## Defense

- Grant sudo rights according to least privilege. Name only the commands a user needs, with arguments where possible.
- Always use absolute paths in sudoers entries, so that PATH abuse is not possible.
- Avoid `NOPASSWD` for anything that can run a shell or write privileged files.
- Do not grant `SETENV` or `env_keep` for interpreters or loaders.
- Keep sudo patched, and review `/etc/sudoers.d/` during each audit. See [Prevention and hardening](/methodology/privesc-linux/prevention/).
