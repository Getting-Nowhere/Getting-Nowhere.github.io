---
layout: page
title: "0-day: Netfilter"
subtitle: "Kernel packet filter flaws in netfilter and nf_tables, and how to check kernel exposure"
permalink: /methodology/privesc-linux/0day-netfilter/
---

Netfilter is the kernel subsystem behind packet filtering, connection tracking and network address translation. The `iptables`, `arptables` and `nft` tools configure it. Several local privilege escalation flaws have been found in its code over the years. This page covers the main ones, how to check whether a host's kernel falls in the affected range, and how to reduce exposure. It does not include exploit code, and the notes describe these flaws only at the level of class and version range.

> Some netfilter flaws can corrupt kernel memory, and recovery may need a reboot. Never test them on a production or client host. Report the exposure from version data.
{: .danger }

## Affected flaws

| CVE | Area | Affected kernels (per notes) |
|---|---|---|
| CVE-2021-22555 | Netfilter compatibility code, memory corruption | 2.6 to 5.11 |
| CVE-2022-1015 | nf_tables, memory safety flaw | See the advisory for the range |
| CVE-2022-25636 | `net/netfilter/nf_dup_netdev.c`, heap out-of-bounds write | 5.4 to 5.6.10 |
| CVE-2023-32233 | nf_tables anonymous sets, use-after-free | Up to and including 6.3.1 |

The notes cover the four CVEs at this level. Check each advisory for the exact fixed build before writing a finding.

## Workflow

1. Record the kernel version and build.

```bash
uname -r
uname -a
```

2. Check whether the netfilter and nf_tables modules are loaded. Some kernels build them in, so an absent module does not prove absence of the code.

```bash
lsmod | grep -E "nf_tables|nf_dup|x_tables"
grep -E "NF_TABLES|NETFILTER_XT" /boot/config-$(uname -r) 2>/dev/null
```

3. Check the packet filter tooling that is in use. This shows whether the host uses the legacy or nf_tables backend.

```bash
iptables --version
nft --version
```

4. For CVE-2023-32233 and similar nf_tables flaws, check whether unprivileged user namespaces are available, since many public routes depend on them. Confirm the dependency in the advisory.

```bash
sysctl user.max_user_namespaces
sysctl kernel.unprivileged_userns_clone 2>/dev/null
```

5. Compare the kernel version with the table above and the vendor advisory, then record the result.

## What to look for

| Signal | Interpretation |
|---|---|
| Kernel in an affected range with no vendor fix | Exposed. Report and schedule an update |
| nf_tables loaded and kernel at or below 6.3.1 | Check CVE-2023-32233 advisory and fixed build |
| Unprivileged user namespaces enabled | Widens the reachable attack surface |
| Netfilter built into the kernel | `lsmod` is empty but the code is present |

## Pitfalls

- A host with no firewall rules may still load the modules, since they load on demand.
- Distribution kernels backport fixes. The upstream range is a starting point, not a verdict.
- A failed kernel exploit can crash the host, and recovery may need a reboot. Record this risk in the report.
- `iptables` may be a wrapper around `nft`. Check the version of both.

## Defense

Install the vendor kernel update that fixes each CVE, reboot, and confirm the running kernel. Disable kernel modules that the host does not need through `/etc/modprobe.d/` so that they cannot be loaded by an unprivileged route. Restrict unprivileged user namespaces where the workload allows it. Keep firewall policy in a managed configuration so that changes are reviewed.

See [Kernel exploits](/methodology/privesc-linux/kernel-exploits/), the [0-day quick reference](/methodology/privesc-linux/0day-quick-reference/), and [Prevention and hardening](/methodology/privesc-linux/prevention/).
