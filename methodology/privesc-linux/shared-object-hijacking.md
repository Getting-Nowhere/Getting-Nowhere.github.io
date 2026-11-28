---
layout: page
title: "Shared Object Hijacking"
subtitle: "Abusing library search paths, RUNPATH and LD_PRELOAD in privileged programs"
permalink: /methodology/privesc-linux/shared-object-hijacking/
---

Most Linux programs load shared libraries (`.so` files) at run time. The dynamic loader decides where to look based on compiled-in paths, environment variables and system configuration. A privileged program that loads a library from a location the attacker can write to will run the attacker's code with its privileges. This page covers how the loader searches, how to find a weak search path, and how environment variables can change the search for sudo-run programs.

## Workflow

1. Find privileged programs (SUID, sudo-permitted or root-run) with non-standard library dependencies.
2. List the libraries each program loads and their resolved paths.
3. Inspect the program's RUNPATH and RPATH.
4. Check the write permission on each directory in the search path.
5. Check the environment rules that sudo applies to library-loading variables.

## Step 1: Find the library dependencies

```bash
ldd /path/to/binary
```

Each line shows a library name, the path it resolved to, and its load address. Look for:

- Libraries outside the standard directories (`/lib`, `/usr/lib`, `/lib/x86_64-linux-gnu`).
- A library name that does not exist in any standard location (the loader then searches the paths in the program's RUNPATH).

## Step 2: Inspect RUNPATH and RPATH

```bash
readelf -d /path/to/binary | grep -i "PATH"
```

Example output:

```text
0x000000000000001d (RUNPATH)            Library runpath: [/development]
```

RUNPATH entries are searched before the standard directories. A RUNPATH that points to a directory the current user can write to is a candidate for library hijacking.

Entries can also come from:

- `LD_LIBRARY_PATH` and `LD_RUN_PATH` in the environment of the program.
- `/etc/ld.so.conf` and the files in `/etc/ld.so.conf.d/`, which list system-wide library directories.

Check the directories listed in `/etc/ld.so.conf.d/` for write permission as well.

## Step 3: Check the write permission

```bash
ls -ld /development
ls -la /development
cat /etc/ld.so.conf.d/*.conf 2>/dev/null
```

A directory writable by all users, in the RUNPATH of a SUID program, is a critical finding. The program loads whatever library with the expected name appears there first.

## Step 4: Identify the missing symbol

A program that fails to start with a `symbol lookup error` can indicate that the library it expects has been replaced or is incompatible. The name of the missing function is recorded in the error message. Use the program's documentation, its source, or `nm -D` on the expected library to confirm which functions it needs. Do not place a copy of a system library as a substitute on a target without approval, because it can break the program for other users.

## Step 5: Environment variables under sudo

`LD_PRELOAD` loads a library before any other, so its functions override those in later libraries. Sudo strips most environment variables by default. A variable can reach the program only when:

- the sudoers rule grants `SETENV` for that command, or
- the variable is listed in `env_keep`.

Check with:

```bash
sudo -l | grep -i "SETENV\|env_keep\|LD_"
```

If `LD_PRELOAD` is kept or settable, a sudo-permitted service command can load a library chosen by the user. Note that this only matters if the command runs as root through sudo.

## What to look for

- A SUID or sudo-run program whose RUNPATH points to a writable directory.
- A directory listed in `ld.so.conf` that is writable by non-administrators.
- `SETENV` or `env_keep` for `LD_PRELOAD`, `LD_LIBRARY_PATH` or other loader variables.
- Non-standard libraries in `/usr/local`, `/opt` or user-writable directories.

## Pitfalls

- Setuid programs ignore `LD_PRELOAD` and `LD_LIBRARY_PATH` when the real and effective IDs differ, unless the program is run in a particular way. Check the behaviour on the target instead of assuming.
- Sudo rules that name the command with an absolute path still load libraries the way the binary is set up. The variable is the only part an attacker can influence.
- Replacing a library breaks other programs that use it. Test on a copy where the rules of engagement allow.
- Remove any library placed during testing, and check that the program runs normally afterwards.

## Defense

- Do not compile RUNPATH entries that point to writable directories. Use `readelf -d` in the build pipeline to check.
- Keep library directories owned by root with no write access for other users. Audit `/etc/ld.so.conf.d/` on each review.
- Do not grant `SETENV` or keep `LD_*` variables for sudo commands.
- Use `ldd` and `readelf` to review new software before deployment.
- See [Python library hijacking](/methodology/privesc-linux/python-library-hijacking/) for the same class in interpreters, and [Prevention and hardening](/methodology/privesc-linux/prevention/).
