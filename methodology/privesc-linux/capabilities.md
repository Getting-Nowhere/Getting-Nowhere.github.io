---
layout: page
title: "Linux Capabilities"
subtitle: "Finding file capabilities that grant privileges without full root"
permalink: /methodology/privesc-linux/capabilities/
---

Linux capabilities split root's powers into separate units such as `CAP_NET_RAW` or `CAP_DAC_OVERRIDE`. A file can be granted specific capabilities with `setcap`, so that it runs with those powers without being SUID. This is a safer design than SUID, but some capabilities are effectively equal to root, and a binary that carries one of them can be used to read, write or execute as root.

## Workflow

1. Enumerate every file that has capabilities set.
2. Classify each capability as low, medium or root-equivalent.
3. Check whether the binary is on GTFOBins under a capability context.
4. Confirm the effect with a read-only test.
5. Report the capability and the minimal fix.

## Step 1: Enumerate file capabilities

```bash
getcap -r / 2>/dev/null
find /usr/bin /usr/sbin /usr/local/bin /usr/local/sbin -type f -exec getcap {} \; 2>/dev/null
```

Example output:

```text
/usr/bin/vim.basic cap_dac_override=eip
/usr/bin/ping cap_net_raw=ep
/usr/bin/mtr-packet cap_net_raw=ep
```

Expected entries on many systems include `ping` and `mtr-packet` with `cap_net_raw`. Unexpected entries, especially editors, interpreters and shells, need attention.

## Step 2: Read the capability flags

The text after the `=` is the set of flags:

| Flag | Meaning |
|---|---|
| `e` | Effective: active when the program runs |
| `p` | Permitted: capabilities the process may use |
| `i` | Inheritable: may pass to child processes through inheritable sets |

`=ep` or `=eip` means the capability is active when the file runs. Capability sets on an interpreter or editor are more dangerous because the program can perform arbitrary operations.

## Step 3: Classify the capability

| Capability | Risk when set on a general program |
|---|---|
| `cap_setuid` | Lets the process change its UID, including to 0 |
| `cap_setgid` | Lets the process change its GID, including to 0 |
| `cap_dac_override` | Bypasses file read, write and execute permission checks |
| `cap_sys_admin` | Broad administrative powers, including mounts and many system settings |
| `cap_sys_module` | Loads and unloads kernel modules |
| `cap_sys_ptrace` | Debugs and attaches to other processes, which can expose memory |
| `cap_sys_chroot` | Changes the root directory for the process |
| `cap_sys_time` | Modifies the system clock |
| `cap_sys_resource` | Changes resource limits |
| `cap_sys_nice` | Changes process priority |
| `cap_net_bind_service` | Binds to ports below 1024 |
| `cap_net_raw` | Crafts raw packets and captures traffic |

`cap_net_bind_service`, `cap_net_raw` and `cap_sys_nice` are narrow in scope. The others can lead to root, and `cap_setuid`, `cap_dac_override` and `cap_sys_admin` are the most direct.

## Step 4: Test the effect

Read-only confirmations are preferred. For example, for `cap_dac_override` on an editor, confirm that the editor can open a root-owned file in read-only mode before any write is attempted. A write to a system file (such as `/etc/passwd`) changes the target and is only in scope when the rules of engagement allow it, with a backup taken first.

## What to look for

- Editors, shells, interpreters, archivers and package managers with any capability set.
- `cap_dac_override`, `cap_setuid` or `cap_sys_admin` on any user-accessible binary.
- Capabilities set on scripts or libraries (capabilities apply to ELF binaries only; check the file type).
- Capabilities that are not in the distribution's default set.

## Pitfalls

- `getcap` needs a complete search. Restricting it to `/usr/bin` misses `/opt`, `/usr/local` and `/snap` locations.
- Capabilities are removed when a file is replaced or rewritten, so a previous `setcap` may need to be re-applied to test.
- A binary with capabilities may still be restricted by the `nosuid`-style mount options. Check `mount` output.
- Some kernels or containers restrict which capabilities a process can gain, even when the file has them.

## Defense

- Remove capabilities that are not required: `setcap -r /path/to/binary`.
- Never grant capabilities to editors, shells, interpreters or general-purpose archivers.
- Grant the narrowest capability that does the job, for example `cap_net_bind_service` for a web server binding port 80.
- Run `getcap -r /` as part of each configuration audit. See [Special permissions](/methodology/privesc-linux/special-permissions-suid/) and [Prevention and hardening](/methodology/privesc-linux/prevention/).
