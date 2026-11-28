---
layout: page
title: "Vulnerable Services"
subtitle: "Checking services and daemons for version flaws and root-run misconfigurations"
permalink: /methodology/privesc-linux/vulnerable-services/
---

Services that run as root are a common source of local escalation. Their risk comes from two places: a known flaw in a specific version, or a configuration that lets a lower-privileged user change what the root process does. This page covers how to find the services, check their versions, and judge the misconfiguration types that appear most often in practice.

## Workflow

1. List running services and the account each runs as.
2. Record the version of each service that runs as root or is setuid.
3. Compare versions with advisories and the distribution's package status.
4. Check the service's configuration, sockets and runtime files for write access.
5. Check the misconfiguration types in the sections below.

## Step 1: Find services and their owners

```bash
ps aux | grep root | grep -v "\[" 
ss -tlnp
ss -xlp 2>/dev/null
systemctl list-units --type=service --state=running 2>/dev/null
```

Note each service's binary path, its owner, and any socket it listens on. Local-only sockets (Unix sockets) are often overlooked by network scans.

## Step 2: Check versions

```bash
dpkg -l | grep -i "SERVICE_NAME"       # Debian and Ubuntu
rpm -qa | grep -i "SERVICE_NAME"       # Red Hat and derivatives
SERVICE_BINARY --version
```

For programs without a version flag, read the package version from the package manager. Versions reported by the program and by the package may differ when the distribution backports fixes; the package changelog shows whether a fix is present.

## Step 3: Known-flaw example: a setuid terminal multiplexer

The notes describe a setuid build of GNU Screen (sample output `Screen version 4.05.00`) that opens and writes a log file with insufficient checks, so that a local user can create or truncate files that root owns. The general class is "a privileged program writes to a path an attacker can influence". Confirm:

```bash
screen -v
ls -l $(which screen)
```

A setuid root `screen` at an affected version is a finding. Do not run public proof-of-concept code on a live host without approval. Report the version, the advisory and the fix.

## Step 4: Misconfigurations to check

### Writable service configuration or runtime files

```bash
find /etc /opt /usr/local -writable -type f 2>/dev/null
ls -l /run /var/run 2>/dev/null
```

A configuration file read by a root service, or a PID or socket file the service trusts, can be changed to redirect the service.

### Shared sessions owned by privileged users

A `tmux` session started by root on a socket with weak permissions can be attached by a user in the socket's group. Check:

```bash
ps aux | grep -i "tmux\|screen"
ls -l /path/to/socket
```

If a root-owned socket has a group the current user belongs to, the session is reachable. Report the owner, group and mode.

### NFS exports with root access

```bash
showmount -e TARGET_IP
```

Each export is listed with its options. `root_squash` maps remote root to an unprivileged user and prevents setuid files created as root. `no_root_squash` lets remote root create root-owned files on the export, which can be used to place a setuid binary when the export is also mounted on the host. Check the export options in `/etc/exports` on the server, and report `no_root_squash` as a finding.

### Passive capture

Traffic capture tools available to unprivileged users can expose cleartext credentials. See [Credential hunting](/methodology/privesc-linux/credential-hunting-linux/).

## What to look for

- Root-run services with a version older than the distribution's current fix.
- Setuid helper programs (such as multiplexers or editors) that write to paths controlled by the user.
- Sockets or sessions owned by root with a group the current user belongs to.
- Exports with `no_root_squash` or with write access for remote users.

## Pitfalls

- Version strings can be misleading. Check the package changelog before concluding a version is affected.
- A service that is installed but not running may not be a path. Confirm it runs.
- Restarting a service disrupts users. Plan any test that requires a restart with the owner.
- Do not leave test files in shared runtime directories.

## Defense

- Patch services on a schedule and remove services that are not required.
- Run services as dedicated, unprivileged accounts with minimal file access.
- Remove the setuid bit from helper programs that do not need it. See [Special permissions](/methodology/privesc-linux/special-permissions-suid/).
- Set restrictive permissions on sockets and session files. Do not place shared sessions in group-accessible locations.
- Use `root_squash` (the default) on NFS exports, and restrict exports to the required hosts.
- See [Prevention and hardening](/methodology/privesc-linux/prevention/).
