---
layout: page
title: "Cron Job Abuse"
subtitle: "Finding scheduled root jobs that run scripts or commands an attacker can control"
permalink: /methodology/privesc-linux/cron-job-abuse/
---

Cron runs commands at scheduled times. Administrators use it for backups, cleanup and maintenance, and many of those jobs run as root. If a root cron job runs a script or uses a directory that a lower-privileged user can write to, the job executes the attacker's content with root rights at the next scheduled run. This page covers how to find the jobs, confirm they run, and assess whether they can be changed.

## Workflow

1. List every scheduled job, system-wide and per user.
2. Look for scripts, binaries and directories that the job uses, and check their permissions.
3. Watch the processes to confirm which jobs actually run, and how often.
4. Check the job's environment (PATH, working directory, wildcards).
5. Report the writable element and the fix.

## Step 1: Enumerate scheduled jobs

```bash
cat /etc/crontab
ls -la /etc/cron.d/ /etc/cron.hourly/ /etc/cron.daily/ /etc/cron.weekly/ /etc/cron.monthly/
ls -la /var/spool/cron/ /var/spool/cron/crontabs/ 2>/dev/null
crontab -l
systemctl list-timers 2>/dev/null
```

A crontab entry has six fields in this order: minute, hour, day of month, month, day of week, command. For example, `0 */12 * * * /home/admin/backup.sh` runs every 12 hours. Entries in `/etc/crontab` and `/etc/cron.d/` also include a user field.

Systemd timers are a modern equivalent. Check them too, because they can run as root from unit files that a user may be able to change.

## Step 2: Check the permissions of each element

Every file the job touches needs checking, not only the job file itself:

```bash
find / -path /proc -prune -o -type f -perm -o+w -print 2>/dev/null | grep -v "^/sys"
ls -l /path/to/script.sh
ls -ld /path/to/script/directory
```

Look at:

- The script the job runs (owner, mode, and write access for the current user).
- The directory that contains the script (a writable directory allows a file to be replaced).
- Any file or directory the script reads or writes (configuration, input, output).
- Any command the script calls by name (see [PATH abuse](/methodology/privesc-linux/path-abuse/)).

## Step 3: Watch the jobs run

Static reading shows what a job is configured to do. Process monitoring shows what actually runs, including jobs hidden from the crontab (such as those started by other scheduled units). A tool such as pspy can watch process creation and file events without root:

```bash
./pspy64 -pf -i 1000
```

The `-pf` flags print command lines and file system events, and `-i 1000` polls every second. Use the output to confirm the script name, the user, and the run interval.

## Step 4: Assess the risk

| Condition | Assessment |
|---|---|
| Root job runs a script that the current user can write | High: content runs as root |
| Script directory is writable, script is not | High: the script can be replaced |
| Job uses a wildcard in a writable directory | High: see [Wildcard abuse](/methodology/privesc-linux/wildcard-abuse/) |
| Job calls commands by name with a writable PATH entry | Medium to high: see [PATH abuse](/methodology/privesc-linux/path-abuse/) |
| Job runs as root but reads only from root-owned paths | Low |

## What to look for

- A world-writable script that root runs from cron. The notes describe a backup script with write access for all users, executed by a root job every few minutes.
- A job that appears in the process monitor but not in any obvious configuration file.
- Output files that appear at a regular interval, which show the job is running and how often.

## Pitfalls

- Do not edit a live script without a copy. Take a backup and restore it after the test.
- Confirm that the edit does not break the script's normal function, or the job will fail and alert the administrators.
- Cron runs with a minimal environment. Commands that work in an interactive shell may be missing.

## Defense

- Own cron scripts and their directories as root, with no write permission for others.
- Use absolute paths for every command in the job and set PATH explicitly at the top of the script.
- Avoid wildcards in privileged jobs, or use `./*` and `--` forms.
- Run scheduled jobs as the least-privileged account that works.
- Audit `/etc/cron*` and user crontabs on each review, and alert on changes with file integrity monitoring. See [Prevention and hardening](/methodology/privesc-linux/prevention/).
