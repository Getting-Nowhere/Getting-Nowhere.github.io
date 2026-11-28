---
layout: page
title: "Logrotate"
subtitle: "Abusing log rotation that runs as root over files a low-privilege user can influence"
permalink: /methodology/privesc-linux/logrotate/
---

`logrotate` archives, compresses and removes log files on a schedule, usually from a root cron job. It renames the current log, creates a new one with set permissions, and runs any configured hooks. If the log directory or the files it manages can be written by a low-privilege user, the rotation can be made to act on attacker-chosen paths or content while running as root. This page covers the conditions, the checks, and how to decide whether the path applies.

## Workflow

1. Confirm that `logrotate` runs as root and how often.
2. Read the global configuration and the per-service rule files.
3. Check the write permissions on the log files and their directories.
4. Check the `logrotate` version against known advisories.
5. Confirm the conditions without modifying the logs of production services.

## Step 1: Confirm how logrotate runs

```bash
logrotate --version | head -n1
cat /etc/logrotate.conf | grep -v "^#"
ls -la /etc/cron.daily/logrotate 2>/dev/null
ls -la /etc/logrotate.d/
cat /var/lib/logrotate.status 2>/dev/null
```

The status file shows the last rotation date for each log. Its contents also show which logs are managed and how recently they were rotated. The rule for each service sits in `/etc/logrotate.d/`.

Example rule (the `dpkg` rule on a standard host):

```text
/var/log/dpkg.log {
        monthly
        rotate 12
        compress
        delaycompress
        missingok
        notifempty
        create 644 root root
}
```

## Step 2: Identify the options that matter

| Option | Relevance |
|---|---|
| `create MODE OWNER GROUP` | Rotation creates a new file with these permissions and owner |
| `compress` and `delaycompress` | Archives the rotated log, which changes file names |
| `postrotate` and `prerotate` | Runs commands as root after or before rotation |
| `su USER GROUP` | Rotation runs as the given account for that log |
| `missingok`, `notifempty` | Do not affect the attack path but change behaviour when files are absent or empty |

A `postrotate` or `prerotate` script that is writable by the current user is a direct root-execution path.

## Step 3: Check permissions on logs and directories

```bash
ls -ld /var/log /var/log/*
find /var/log -writable 2>/dev/null
find /etc/logrotate.d -writable 2>/dev/null
```

The condition for a rotation-based path is write access to the log file, or to the directory that rotation writes into, combined with root execution of `logrotate`.

## Step 4: Check the version

Some `logrotate` releases have had flaws in how they handle rotation with the `create` option and in how they follow symbolic links. The notes list vulnerable versions 3.8.6, 3.11.0, 3.15.0 and 3.18.0 for a rotation-based race. Compare the reported version with the distribution's advisories. The version alone does not prove exposure; the configuration and permissions must also match.

## Step 5: Check the conditions

Before any further step, confirm all of these:

- `logrotate` runs as root (cron or systemd timer, with the root user).
- The log that is rotated is writable by the current user, or sits in a directory that is.
- The configured options (for example `create`, `compress`) match the conditions in the advisory.
- The version matches a known affected release.

If any condition fails, the path does not apply and the finding should be recorded as ruled out.

## What to look for

- A log directory or log file owned by a non-root account.
- A `postrotate` script that a low-privilege user can edit.
- A rotation rule with `create` and a non-root owner that makes the new file writable by the attacker.
- Recent rotation timestamps that show the job is active.

## Pitfalls

- Modifying a production log can disrupt the service that writes to it. Use a test log if one exists, or stop at the confirmation step.
- Rotation runs on schedule. Note the run time from the status file before planning a test.
- Symbolic links in log directories can redirect rotation. Check `ls -l` output for link targets.
- Remove any file or link created during a test.

## Defense

- Keep log directories and log files owned by root or the logging service account, with no write access for other users.
- Set `create` modes explicitly and with restrictive owners (`640` or `600`).
- Keep `logrotate` patched to a current release.
- Avoid `postrotate` scripts that are writable by others, and use absolute paths for every command they call.
- Use `su` in rotation rules to run them as the service account, not root, where the logs allow it.
- See [Cron job abuse](/methodology/privesc-linux/cron-job-abuse/) and [Prevention and hardening](/methodology/privesc-linux/prevention/).
