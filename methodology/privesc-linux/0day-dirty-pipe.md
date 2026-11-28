---
layout: page
title: "0-day: Dirty Pipe"
subtitle: "Kernel pipe flaw (CVE-2022-0847) that allows writes to read-only files, and how to check exposure"
permalink: /methodology/privesc-linux/0day-dirty-pipe/
---

Dirty Pipe is a Linux kernel flaw, tracked as CVE-2022-0847, in how pipe buffers are handled. A local user who can read a file can write into the kernel's cached copy of that file, even when the user has no write permission. It is similar in effect to Dirty COW (CVE-2016-5195). This page explains the class, how to check whether a host is exposed, and the fix. It does not include exploit code. Use it to decide whether the host needs a kernel update, and to report the finding.

> Running a public proof of concept modifies files that root-owned services read, and a failed run can corrupt data. Do not run it on a client or production host. Confirm the exposure from version data and report it.
{: .danger }

## Affected versions

Per the source notes, kernels from `5.8` through `5.17` are affected. Android devices running these kernels are also affected. Upstream fixed the flaw in the stable branches `5.16.11`, `5.15.25` and `5.10.102`. Distribution kernels often carry the fix in a build whose version string looks old, so use the vendor advisory for the final answer.

## Workflow

1. Record the running kernel and the distribution.

```bash
uname -r
uname -a
cat /etc/os-release
```

2. Check whether the installed kernel package has been updated, and whether the running kernel is the updated one.

```bash
dpkg -l 'linux-image*' | awk '/^ii/ {print $2, $3}'
rpm -q kernel
```

3. Compare the running kernel with the vendor advisory for the CVE. Check the fixed build number, not only the upstream range.

4. If the host is in the range and the vendor build does not include the fix, record it as a finding. Note the account that can exercise it, since any local user with read access to a file is in scope.

## What to look for

| Result | Interpretation |
|---|---|
| Kernel 5.8 to 5.17 with no vendor fix | Exposed. Report and schedule an update |
| Kernel in range with a vendor backport | Not exposed. Record the advisory as the reason |
| Kernel below 5.8 or at 5.18 and later | Outside the stated range. Confirm against the advisory |
| Update installed but not rebooted | Still exposed until the running kernel changes |

## Pitfalls

- The kernel version alone can mislead. Distribution backports change the build without changing the upstream number.
- An installed kernel package is not the running kernel. Check `uname -r` after the reboot.
- Testing modifies files in the page cache. A test on a live system can break services that read those files.
- Read-only files are the target class. Do not assume that the file permissions on sensitive files protect them from this flaw.

## Defense

Install the vendor kernel update that includes the CVE-2022-0847 fix, then reboot and confirm the running kernel. Until the update is applied, limit which accounts can log in locally. Monitor sensitive files such as authentication databases and SUID binaries with file integrity monitoring, so that unexpected changes are noticed. Patch cycles should treat local kernel flaws as urgent when a shell is shared or exposed.

For the wider process, see [Kernel exploits](/methodology/privesc-linux/kernel-exploits/) and the [0-day quick reference](/methodology/privesc-linux/0day-quick-reference/). For hardening controls, see [Prevention and hardening](/methodology/privesc-linux/prevention/).
