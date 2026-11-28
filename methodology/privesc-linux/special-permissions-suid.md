---
layout: page
title: "Special Permissions (SUID and SGID)"
subtitle: "Finding binaries that run with the owner's or group's rights and judging their risk"
permalink: /methodology/privesc-linux/special-permissions-suid/
---

The set-user-ID (SUID) and set-group-ID (SGID) permission bits make a program run with the rights of its file owner or group rather than the caller's. They are a deliberate mechanism, used by programs such as `passwd`, but any SUID root binary that can be made to run attacker-controlled code, read or write arbitrary files, or spawn a shell hands the attacker root. This page covers how to enumerate these bits and assess each finding.

## Workflow

1. Enumerate SUID and SGID files across the filesystem.
2. Remove the expected, distribution-standard binaries from the list.
3. Compare each remaining binary with GTFOBins and its version advisories.
4. Check whether the binary's configuration, libraries or helper programs are writable.
5. Confirm the path with a read-only test where possible.

## Step 1: Enumerate SUID and SGID binaries

```bash
find / -user root -perm -4000 -exec ls -ldb {} \; 2>/dev/null
find / -user root -perm -6000 -exec ls -ldb {} \; 2>/dev/null
find / -perm -4000 -type f 2>/dev/null
find / -perm -2000 -type f 2>/dev/null
```

The `-4000` mask finds SUID files and `-2000` finds SGID files. The `-6000` mask finds files with both bits set. Run the broader searches with `-type f` to catch files owned by other accounts.

Expected output includes standard binaries such as `passwd`, `su`, `mount`, `umount` and `ping`. Those are normal on most distributions. Anything else is a candidate.

## Step 2: Remove the expected set

Compare the list against a known-good baseline for the distribution, or against a clean host of the same release. Keep the unexpected entries, including binaries installed by third-party software, custom scripts and binaries in `/usr/local` or `/opt`.

```bash
find / -perm -4000 -type f 2>/dev/null | grep -v "^/proc" | sort > suid_list.txt
```

## Step 3: Assess each binary

For each unexpected binary:

1. Check its version: `binary --version` or the package manager.
2. Look it up on [GTFOBins](https://gtfobins.github.io/) under the SUID context. The index lists the binaries that can be used to spawn a shell or read or write files when run with SUID.
3. Check its advisories for the version in use.
4. Run `ldd` to see its libraries, and `readelf -d` to see its RUNPATH (see [shared object hijacking](/methodology/privesc-linux/shared-object-hijacking/)).

## Step 4: Check for writable dependencies

```bash
ls -l /path/to/binary
ls -la /path/to/binary.d /etc/binary.conf 2>/dev/null
```

A SUID binary that loads a configuration file, a helper script or a library from a writable location can be controlled without modifying the binary itself.

## What to look for

- SUID root binaries that are not part of the base install.
- SUID binaries that are interpreters or general-purpose tools (shells, `find`, `vim`, `python`, `perl`, `nmap`).
- SUID binaries that load libraries or configuration from user-writable paths.
- SGID binaries of groups that grant access to devices, logs or backups (such as `disk`, `adm`, `shadow`).
- Files in `/home`, `/tmp` or `/var/tmp` with the SUID bit set. These are almost always a finding.

## Pitfalls

- Some shells drop elevated rights when invoked with the effective UID different from the real UID. Use `-p` where the documented behaviour requires it, and check the binary's own documentation.
- SUID bits on scripts are ignored by most modern systems. Confirm the target is a binary.
- Mount options can disable SUID for an entire filesystem (`nosuid`). Check `mount` output before concluding a file is exploitable.
- Do not delete or change permissions on system binaries during an engagement. Report them and recommend the fix.

## Defense

- Remove the SUID and SGID bits from every binary that does not need them: `chmod u-s FILE` or `chmod g-s FILE`.
- Mount user-writable filesystems with `nosuid` and `nodev`.
- Audit SUID and SGID files on a schedule and compare with a known baseline.
- Keep software packages patched, since many SUID escalations are version-specific.
- See [Prevention and hardening](/methodology/privesc-linux/prevention/) and [Capabilities](/methodology/privesc-linux/capabilities/) for the alternative of granting only the specific privilege required.
