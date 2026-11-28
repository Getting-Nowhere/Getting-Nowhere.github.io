---
layout: page
title: "0-day Quick Reference"
subtitle: "Summary of the public local escalation flaws, the first check for each, and the fixed version"
permalink: /methodology/privesc-linux/0day-quick-reference/
---

This page is a triage table for the public local privilege escalation flaws covered in this section. Use it after the configuration checks have been exhausted. Each row gives the first check to run, the affected range from the source notes, and the fix. Read the detail page before recording a finding.

> Configuration issues come before 0-days in the decision flow. A misconfigured sudo rule, SUID binary or writable service is safer to demonstrate and easier to fix than a memory-corruption flaw.
{: .info }

## Summary table

| Name | CVE | Component | Affected (per notes) | First check | Fixed in | Detail |
|---|---|---|---|---|---|---|
| Dirty Pipe | CVE-2022-0847 | Kernel pipe buffers | Kernel 5.8 to 5.17 | `uname -r` | Stable `5.16.11`, `5.15.25`, `5.10.102`, or vendor backport | [Dirty Pipe](/methodology/privesc-linux/0day-dirty-pipe/) |
| PwnKit | CVE-2021-4034 | polkit `pkexec` | Unpatched polkit builds | `pkexec --version` | Polkit `0.120` or vendor backport | [Polkit](/methodology/privesc-linux/0day-polkit/) |
| Baron Samedit | CVE-2021-3156 | sudo argument handling | For example `1.8.31`, `1.8.27`, `1.9.2`, and others | `sudo -V \| head -n1` | Sudo `1.9.5p2` or vendor backport | [Sudo](/methodology/privesc-linux/0day-sudo/) |
| Runas ID bypass | CVE-2019-14287 | sudo runas handling | Sudo before `1.8.28` | `sudo -V \| head -n1` and `sudo -l` | Sudo `1.8.28` or later | [Sudo](/methodology/privesc-linux/0day-sudo/) |
| Netfilter compat | CVE-2021-22555 | netfilter | Kernel 2.6 to 5.11 | `uname -r` | Vendor kernel update | [Netfilter](/methodology/privesc-linux/0day-netfilter/) |
| nf_dup_netdev | CVE-2022-25636 | netfilter | Kernel 5.4 to 5.6.10 | `uname -r` | Vendor kernel update | [Netfilter](/methodology/privesc-linux/0day-netfilter/) |
| nf_tables sets | CVE-2023-32233 | nf_tables | Kernel up to 6.3.1 | `uname -r` and `lsmod` | Vendor kernel update | [Netfilter](/methodology/privesc-linux/0day-netfilter/) |

## Triage rules

1. Check the configuration first: sudo rules, SUID binaries, capabilities, groups, services and cron. See the [decision flow](/methodology/privesc-linux/).
2. Match the exact package or kernel build to the vendor advisory. Upstream version numbers alone are not enough, because distributions backport fixes.
3. Confirm the account that can reach the flaw. Some flaws need only a local shell, and others need a specific sudoers rule or a loaded module.
4. Test only in an approved lab or on a host where the owner has agreed to the risk. Kernel flaws can crash the host.
5. Record the version, the advisory, the command output and the outcome, even when the host is not exposed.

## Pitfalls

- The table gives the range from the source notes. Confirm the fixed build with the vendor before stating that a host is safe.
- Not exposed by version does not mean secure. Other checks still apply.
- A public proof of concept may be altered or malicious. Read its source and verify its target before running it in a lab.

## Defense

Keep the kernel, sudo, polkit and netfilter packages on a patch cycle, and reboot after kernel updates. Track the installed versions in an inventory. Use live patching where the operations model allows it. See [Prevention and hardening](/methodology/privesc-linux/prevention/) and [Kernel exploits](/methodology/privesc-linux/kernel-exploits/).
