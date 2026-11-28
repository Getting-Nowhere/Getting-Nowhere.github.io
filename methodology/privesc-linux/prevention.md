---
layout: page
title: "Prevention and Hardening"
subtitle: "Controls and audit commands that remove most local privilege escalation paths on Linux"
permalink: /methodology/privesc-linux/prevention/
---

Proper Linux hardening removes most local escalation opportunities. Most of the paths in this section come from a small set of mistakes: out-of-date packages, writable files that root runs, sudo rules that allow shells, loose groups and credentials left in readable places. This page lists the minimum controls, the command to audit each one, and the page that explains the attack it prevents. Run the audit commands on a schedule, not only at build time.

## Controls and audits

| Control | Audit command | Prevents |
|---|---|---|
| Timely patching of kernel and packages | `apt list --upgradable` or `dnf check-update` | [0-day flaws](/methodology/privesc-linux/0day-quick-reference/) |
| Sudo rules without shells or `NOPASSWD` | `sudo -l -U USERNAME` and `visudo -c` | [Sudo rights abuse](/methodology/privesc-linux/sudo-rights-abuse/) |
| SUID and SGID only where needed | `find / -path /proc -prune -o -perm -4000 -type f -ls` | [Special permissions](/methodology/privesc-linux/special-permissions-suid/) |
| Capabilities limited to required binaries | `getcap -r / 2>/dev/null` | [Capabilities](/methodology/privesc-linux/capabilities/) |
| No world-writable files that root runs | `find / -path /proc -prune -o -type f -perm -o+w -print 2>/dev/null` | [Cron job abuse](/methodology/privesc-linux/cron-job-abuse/) |
| Minimal privileged groups | `getent group docker lxd lxc disk adm` | [Privileged groups](/methodology/privesc-linux/privileged-groups/) |
| Absolute paths in privileged jobs | Review crontabs, unit files and sudoers | [PATH abuse](/methodology/privesc-linux/path-abuse/) |
| Credentials kept out of readable places | Search for keys, history and config files | [Credential hunting](/methodology/privesc-linux/credential-hunting-linux/) |

Run a broader scan with a hardening auditor, such as Lynis, and read its warnings and suggestions. Run it as root for the full set of checks.

```bash
sudo ./lynis audit system
```

## Updates and patching

Many quick escalation paths exist for out-of-date kernels and packages. Enable automatic security updates where the change process allows it. On Ubuntu and Debian, `unattended-upgrades` is the standard tool and is installed by default from 18.04 onwards. On Red Hat based systems, `yum-cron` or `dnf-automatic` performs the same task. Reboot after kernel updates so that the running kernel matches the installed one.

## Configuration management

- Audit writable files and directories, and every binary with the SUID or SGID bit.
- Use absolute paths in cron jobs, systemd units, sudoers entries and scripts.
- Keep credentials out of world-readable files, and clean up home directories and shell history.
- Make sure low-privilege users cannot modify custom libraries or modules that privileged programs load.
- Remove packages and services the host does not need, to reduce attack surface.
- Consider SELinux or AppArmor to add mandatory access controls on top of file permissions.

```bash
find /etc/cron* /etc/crontab -type f -perm -o+w 2>/dev/null
find /etc/systemd /lib/systemd -writable -type f 2>/dev/null
```

## User management

Limit the number of user and admin accounts on each system. Log valid and invalid logon attempts, and monitor the logs. Enforce a strong password policy that favours long passphrases over frequent forced changes. Use the PAM password history module with `/etc/security/opasswd` to stop reuse. Check that users are not placed in groups that give more rights than their work needs, and apply least privilege to sudo.

Configuration management tools such as Puppet, SaltStack, Zabbix and Nagios can run these checks across a fleet. Zabbix checksum items can also confirm that sensitive binaries have not changed.

## Audit and review

Run security and configuration checks on every system at a set interval. Baselines such as the DISA STIGs and frameworks such as ISO 27001, PCI DSS and HIPAA can set a common standard, but they are references, not a complete security programme. The controls should be tailored to the host's role and the data it holds.

An audit is not a penetration test. Use it to find configuration drift between tests, and use manual review to confirm what the tool reports.

## What to look for when reviewing a host

- Any NOPASSWD rule, shell in sudoers, or `SETENV` on an interpreter.
- Any SUID binary that is not in the approved baseline.
- Any capability on an editor, interpreter or shell.
- Any root-run job or service that uses a relative path or a writable script.
- Any kernel or package below the fixed version in the advisory.

## Related pages

- [Enumeration](/methodology/privesc-linux/enumeration/) for the checks that the audit mirrors.
- [Privileged groups](/methodology/privesc-linux/privileged-groups/) and [Docker escape](/methodology/privesc-linux/docker-escape/) for group and container controls.
- [Kernel exploits](/methodology/privesc-linux/kernel-exploits/) for kernel patching guidance.
