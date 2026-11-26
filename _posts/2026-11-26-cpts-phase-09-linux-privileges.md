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
