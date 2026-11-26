---
title: "Phase 09 — Linux Privilege Escalation Assessment"
date: 2026-11-26 17:41:00 +0530
categories: [CPTS, Privilege Escalation]
tags: ["PRIVILEGE ESCALATION"]
description: Evaluate Linux identity, delegated privileges, file permissions, privileged execution and host isolation.
permalink: "/posts/cpts-phase-09-linux-privileges/"
toc: true
---

Evaluate Linux identity, delegated privileges, file permissions, privileged execution and host isolation.

> Use this methodology only for systems and test identities within an explicitly authorized assessment. Validate the minimum necessary impact and preserve sanitized evidence.
{: .tip }

## Decision tree

```text
Linux session
  |-- Sudo entries -> inspect run-as identity, command and arguments
  |-- SUID/SGID or capabilities -> verify owner, mode and mount context
  |-- Privileged process or job -> identify actual files and directory ACLs
  |-- Special group or container -> check resource permissions
  `-- No configuration lead -> verify package and kernel patch context
       -> Confirm weakness or park missing prerequisites
```

## 1. Establish the current context

```bash
id
cat /etc/os-release
uname -a
echo "$PATH"
lscpu
lsblk
cat /etc/fstab
getent group sudo
ls /home
```

Check whether this is a normal user, service account, container identity or restricted shell. Identify group membership and filesystem mounts before investigating binaries.

## 2. Sudo and special permissions

```bash
sudo -l
find / -user root -perm -4000 -exec ls -ldb {} \; 2>/dev/null
find / -user root -perm -2000 -exec ls -ldb {} \; 2>/dev/null
find /usr/bin /usr/sbin /usr/local/bin /usr/local/sbin -type f -exec getcap {} \; 2>/dev/null
```

| If found | Verify | Next check |
|---|---|---|
| Sudo entry | Run-as identity, exact executable, arguments and tags | Review the permitted functionality and whether it exceeds intended role |
| SUID/SGID binary | Owner, group, mount restrictions, package provenance | Compare custom binary with intended design |
| Capability | Exact capability and owning executable | Review security boundary affected, particularly filesystem or identity operations |
| Special group | Group's actual resource permissions | Check sockets, devices and management interfaces |

Do not assume a known binary has the same behavior on every build. A permission is a lead, not a demonstrated escalation.

## 3. Privileged processes and scheduled execution

```bash
ps aux | grep root
ls -la /etc/cron.daily/
cat /etc/crontab
systemctl list-timers
find / -path /proc -prune -o -type f -perm -o+w -print 2>/dev/null
```

Correlate a privileged job with its actual command, interpreter, owner, directory and execution schedule. Check write permissions on the script **and its parent directory**. A writable script that is never executed by a privileged identity is not equivalent to a privileged scheduled task.

## 4. Services, installed packages and configuration

```bash
ip a
cat /etc/hosts
ss -tulnp
apt list --installed
sudo -V
find / -type f \( -name '*.conf' -o -name '*.config' \) -exec ls -l {} \; 2>/dev/null
find / -type f -name '*.sh' 2>/dev/null | grep -v 'src\|snap\|share'
```

The `apt` command applies to Debian-derived systems. Inventory configuration metadata; review authorized samples and avoid publishing secret values. For loopback-only services, identify the process and intended local access policy.

## 5. PATH, libraries, containers and version-specific checks

- If a privileged program calls a helper by name, review the actual execution environment, not merely your interactive PATH.
- If a privileged program loads a shared library or Python module, identify the resolved file and directory permissions. Distinguish an import path from a writable path actually used by that program.
- If container tooling is present, inspect group membership, socket ownership and host mounts. `docker image ls` can establish image visibility with an approved identity; container root is not automatically host root.
- If considering Dirty Pipe, Netfilter, Polkit, Sudo or a kernel issue, verify the exact distribution package and backported fixes before classifying the host as affected.

### Stop or continue?

| Lead | Continue only if |
|---|---|
| Writable file | A relevant privileged consumer exists |
| Unusual SUID binary | Its owner, mode and behavior support a boundary issue |
| Writable PATH directory | The privileged process actually uses it |
| Container socket | The current identity has unintended access |
| Kernel version match | Build, patch and configuration prerequisites are established |

**Study-note basis:** Environment Enumeration, Linux Services and Internals, Special Permissions, Capabilities, Sudo Right Abuse, Cron Job Abuse, Path Abuse, Python Library Hijacking, Shared Object Hijacking, Docker, Kernel Exploits.

## Assessment workflow

### 1. Inventory the system

Record effective user/group IDs, OS and kernel, installed packages, interfaces, mounts, processes, services and listening ports. Separate the host from a container or restricted shell context.

### 2. Check delegated privileges first

Review sudo rights, run-as identity, argument restrictions and absolute paths. Inventory unusual SUID/SGID files, file capabilities and privileged group memberships; determine their intended purpose.

### 3. Inspect privileged execution

Review root-owned services, scheduled tasks, cron jobs, log rotation and writable paths. Determine the executing identity, file ownership, directory permissions and runtime configuration. Assess PATH, wildcard, shared-library and Python import risks through configuration review.

### 4. Evaluate isolation boundaries

Review Docker, LXD/container and Kubernetes access, socket permissions and namespace or mount boundaries. A container root identity does not necessarily imply host root.

### 5. Consider version-specific issues last

Review kernel and package versions against exact vendor patch status. Dirty Pipe, Netfilter, Polkit and Sudo issues are examples of version-dependent findings; backported security patches may make a version string misleading.

### 6. Record and remediate

Document the specific privilege boundary and effective permission. Recommend least-privilege sudo rules, restricted groups, protected service files and updated components.

## Decision checklist

| If you observe | Then check | Next action |
| --- | --- | --- |
| Sudo rules exist | Review run-as, command arguments, environment and allowed executable. | Determine whether the delegation is broader than intended. |
| SUID/SGID or a capability is present | Record ownership, package provenance and actual function. | Compare with expected permissions. |
| Privileged service or job references a writable location | Verify the exact path and execution identity without editing files. | Document the configuration weakness. |
| A container management interface is accessible | Verify intended group membership and isolation. | Assess host resource exposure from configuration. |
| Old kernel or service is found | Verify advisory, patch status and platform prerequisites. | Avoid running destabilizing kernel tests. |

## Read-only reference commands

Examples use an approved environment. Replace placeholders with authorized lab values. Commands are reference examples, not an instruction to run them against arbitrary hosts.

```bash
id
uname -a
cat /etc/os-release
sudo -l
ps aux
ss -lnt
find /usr -xdev -type f \( -perm -4000 -o -perm -2000 \) -ls 2>/dev/null
getcap -r /usr/bin /usr/sbin 2>/dev/null
```

## Common mistakes and missed checks

- Ignoring writable parent directories, service identities or relative paths.
- Confusing a standard SUID executable with a misconfiguration.
- Checking kernel versions before straightforward permissions and delegation.

## When to stop and reassess

Do not replace executables, manipulate privileged jobs or execute kernel proof-of-concepts on public systems.

## Expected deliverable

A host privilege inventory, verified risky permission or execution relationships and specific mitigations.

## Related methodology

- [Complete penetration testing methodology]({{ '/posts/cpts-methodology/' | relative_url }})
- [Phase 12 — Network Segmentation and Lateral Access Assessment]({{ '/posts/cpts-phase-12-network-boundaries/' | relative_url }})
- [Phase 13 — Validation, Reporting and Closeout]({{ '/posts/cpts-phase-13-reporting/' | relative_url }})

## Study basis

Adapted from CPTS study topics: Linux Privilege Escalation: Information Gathering, Permission, Environment, Service and Internals Based Privilege Escalation; Prevention. The sequencing and validation criteria are an editorial synthesis for a public assessment reference.
