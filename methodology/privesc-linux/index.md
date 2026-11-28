---
layout: page
title: "Linux Privilege Escalation"
subtitle: "Decision flow and checklist for moving from a low-privilege shell to root"
permalink: /methodology/privesc-linux/
---

This section is the entry point for local privilege escalation on Linux. It orders the checks by how quickly each one pays off and how much risk it carries for the target. Work through the phases in order and move on only when the current phase has been exhausted or ruled out. Most real escalations come from configuration mistakes, not from kernel bugs, which is why the kernel is checked last.

> If the shell is restricted (rbash, rksh, rzsh), escape it first. Enumeration commands behave unpredictably inside a restricted shell, and some will simply fail.
{: .info }

## Decision flow

```text
Low-privilege shell
  |
  0. Restricted shell?            escape first (restricted-shell-escape)
  1. Identity and environment     id, hostname, OS, PATH, users, shells, mounts
  2. Sudo rights                  sudo -l, NOPASSWD, SETENV, env_keep, sudo version
  3. SUID, SGID, capabilities     special permissions, getcap, privileged groups
  4. Cron jobs and services       root-run jobs, writable scripts, service flaws
  5. Writable paths and loaders   PATH, library and module search paths, wildcards
  6. Credentials                  config files, history, keys, backups, traffic
  7. Kernel and 0-day             last resort: version match, crash risk
  |
Root (or a higher-privilege account)
```

## Phase checklist

Tick each item before moving to the next phase. A "no" is a result; record it so that the report shows what was ruled out.

- [ ] Identity: `id`, groups, home directories, other logged-in users
- [ ] Host: OS release, kernel build, installed shells, mounts and `/etc/fstab`
- [ ] Sudo: `sudo -l` output reviewed for NOPASSWD, SETENV and wildcards; sudo version recorded
- [ ] Special permissions: SUID and SGID binaries compared against GTFOBins
- [ ] Capabilities: `getcap` run over the binary directories
- [ ] Privileged groups: docker, lxd or lxc, disk, adm, and any custom group membership
- [ ] Scheduled work: `/etc/crontab`, `/etc/cron.*`, user crontabs, and a process monitor such as pspy
- [ ] Services: listening sockets, service versions, service configuration owned by root
- [ ] Log rotation: `logrotate` configuration and write access to log directories
- [ ] Writable paths: writable PATH entries, writable script or library paths, writable module directories
- [ ] Library loading: RUNPATH and RPATH of SUID binaries, `LD_PRELOAD` and `PYTHONPATH` exposure
- [ ] Credentials: web roots, configuration files, shell history, SSH keys, backups, environment variables
- [ ] Containers and orchestration: Docker socket, Kubelet API, service account tokens
- [ ] Kernel and packages: kernel build compared with advisories, polkit and sudo versions

## Topic pages

### Foundations

- [Enumeration](/methodology/privesc-linux/enumeration/)
- [Credential hunting](/methodology/privesc-linux/credential-hunting-linux/)
- [Services and internals enumeration](/methodology/privesc-linux/linux-services-enumeration/)

### Sudo, special permissions and privileges

- [Sudo rights abuse](/methodology/privesc-linux/sudo-rights-abuse/)
- [Special permissions (SUID and SGID)](/methodology/privesc-linux/special-permissions-suid/)
- [Capabilities](/methodology/privesc-linux/capabilities/)
- [Privileged groups](/methodology/privesc-linux/privileged-groups/)

### Scheduled work and services

- [Cron job abuse](/methodology/privesc-linux/cron-job-abuse/)
- [Logrotate](/methodology/privesc-linux/logrotate/)
- [Vulnerable services](/methodology/privesc-linux/vulnerable-services/)

### Containers and orchestration

- [Docker escape](/methodology/privesc-linux/docker-escape/)
- [Kubernetes](/methodology/privesc-linux/kubernetes/)

### Writable paths, loaders and shells

- [PATH abuse](/methodology/privesc-linux/path-abuse/)
- [Wildcard abuse](/methodology/privesc-linux/wildcard-abuse/)
- [Restricted shell escape](/methodology/privesc-linux/restricted-shell-escape/)
- [Shared object hijacking](/methodology/privesc-linux/shared-object-hijacking/)
- [Python library hijacking](/methodology/privesc-linux/python-library-hijacking/)

### Kernel and 0-day

- [Kernel exploits](/methodology/privesc-linux/kernel-exploits/)
- [0-day quick reference](/methodology/privesc-linux/0day-quick-reference/)
- [Dirty Pipe (CVE-2022-0847)](/methodology/privesc-linux/0day-dirty-pipe/)
- [Polkit pkexec (CVE-2021-4034)](/methodology/privesc-linux/0day-polkit/)
- [Sudo (CVE-2021-3156, CVE-2019-14287)](/methodology/privesc-linux/0day-sudo/)
- [Netfilter (CVE-2021-22555 and related)](/methodology/privesc-linux/0day-netfilter/)

### Defense

- [Prevention and hardening](/methodology/privesc-linux/prevention/)

## Reporting notes

- Record the exact command, its output, and the account it ran under for every finding.
- Prefer a privilege path that is a configuration issue over one that needs an exploit, because it is safer to demonstrate and easier to fix.
- Do not run kernel exploits on a production or client host without explicit approval. A failed kernel exploit can crash the system.
