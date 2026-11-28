---
layout: page
title: "0-day: Sudo"
subtitle: "Two sudo flaws, CVE-2021-3156 and CVE-2019-14287, and how to check the installed version"
permalink: /methodology/privesc-linux/0day-sudo/
---

Sudo is the standard tool for running commands as another user, and its policy lives in `/etc/sudoers`. Two public flaws are worth checking on any host where sudo is present. The first is a heap overflow in argument handling, tracked as CVE-2021-3156. The second is a bypass of the runas user restriction, tracked as CVE-2019-14287. Both are decided by the installed version and, for the second, by the sudoers rule. This page covers how to check each and how to fix them. It does not include exploit code.

> Check `sudo -l` before you check versions. A sudoers rule that allows a root shell or an editor is a configuration finding, and it is safer to demonstrate than a memory-corruption flaw.
{: .tip }

## Workflow

1. Record the sudo version. This does not need root.

```bash
sudo -V | head -n1
```

2. Compare the version with the vendor advisory for CVE-2021-3156. The notes list affected builds including `1.8.31` (Ubuntu 20.04), `1.8.27` (Debian 10) and `1.9.2` (Fedora 33), and others. Upstream fixed the flaw in `1.9.5p2`. Distribution builds may carry backported fixes.

3. Check the sudoers rules for the runas restriction used by CVE-2019-14287.

```bash
sudo -l
sudo -l -U USERNAME
```

Look for a rule with a `!root` exclusion in the runas list, such as `(ALL, !root)`. That shape is the one the advisory describes as exposed.

4. Compare the version with the fix for CVE-2019-14287, which is sudo `1.8.28`. Versions before `1.8.28` are affected.

5. Record both results. A vulnerable version reachable by a local account is a finding, and so is a runas exclusion that the version does not enforce.

## Background on the two flaws

### CVE-2021-3156: heap overflow

This is a heap-based buffer overflow in sudo's handling of command-line arguments. Any local user can reach the affected code path, not only the users named in sudoers. The version check is the primary test. Confirm the exposure from the version and the advisory, and do not run a proof of concept on a client host.

### CVE-2019-14287: runas ID bypass

The flaw is in how sudo interprets the user ID passed for the runas target. On affected versions, a specially formed ID is handled as root even when the policy excludes root. The notes describe the prerequisite as a sudoers entry for a single command. The sudo advisory describes the exposure as a rule that allows any user except root. Confirm the exact condition against the advisory before writing the finding.

## What to look for

| Signal | Interpretation |
|---|---|
| Sudo below `1.9.5p2` with no distribution fix | Exposed to CVE-2021-3156 |
| Sudo below `1.8.28` | Exposed to CVE-2019-14287 |
| `(ALL, !root)` in `sudo -l` on an affected version | Exposed to CVE-2019-14287 |
| `NOPASSWD` or a shell command in `sudo -l` | Configuration finding, check first |

## Pitfalls

- A `!root` exclusion looks like protection. On an affected version it is not.
- Sudo may come from a different path than the one on the `PATH`. Use `which sudo` and `sudo -V` together.
- Distribution builds carry backports. Read the vendor advisory before reporting an unpatched version.
- Changing sudoers to test a version is a change to the host. Do not do it on a client system.

## Defense

Upgrade sudo to a fixed build from the distribution, which for CVE-2021-3156 means `1.9.5p2` or a backported equivalent, and for CVE-2019-14287 means `1.8.28` or later. Do not rely on `!root` exclusions as a security boundary. Remove `NOPASSWD`, avoid shells and editors in sudo rules, and review `/etc/sudoers.d/` as part of each audit.

See [Sudo rights abuse](/methodology/privesc-linux/sudo-rights-abuse/) for policy review, the [0-day quick reference](/methodology/privesc-linux/0day-quick-reference/) for the other public flaws, and [Prevention and hardening](/methodology/privesc-linux/prevention/).
