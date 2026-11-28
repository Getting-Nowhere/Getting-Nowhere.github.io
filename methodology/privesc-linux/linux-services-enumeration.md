---
layout: page
title: "Services and Internals Enumeration"
subtitle: "Mapping running services, sockets and installed software to find the next privilege path"
permalink: /methodology/privesc-linux/linux-services-enumeration/
---

Once the basic identity and environment checks are done, the next question is what the host runs, who runs it, what it listens on, and which software versions are installed. Every root-owned service is a potential escalation point, either through its configuration or through a known flaw in its version. All steps on this page are read-only.

## Workflow

1. List running processes with their owners and separate the root services.
2. Map listening network and Unix sockets to their processes.
3. Read service unit files and check who can write to them.
4. Record installed packages and their versions.
5. Compare installed binaries with the GTFOBins index.
6. Use tracing and network context to understand how a privileged program behaves.

## Step 1: Running processes and owners

```bash
ps -eo user,pid,ppid,cmd --sort=user
ps aux | grep "^root"
```

Look at the command line, not just the name. Scripts run by root, binaries in writable directories and interpreters with script arguments all matter.

## Step 2: Listening sockets

```bash
ss -tulnp
ss -xlp
find / -type s -ls 2>/dev/null
```

`ss -tulnp` lists TCP and UDP listeners with their process names. The `-p` flag needs root to show processes owned by other accounts, so an empty column is not proof that nothing is listening. `ss -xlp` shows Unix domain sockets. A socket that root created with a writable group or world permission is a finding (see [Vulnerable services](/methodology/privesc-linux/vulnerable-services/)).

## Step 3: Service units and their configuration

```bash
systemctl list-units --type=service --state=running
systemctl list-unit-files --type=service
grep -rhE "^(User|ExecStart|ExecStartPre|EnvironmentFile)=" /etc/systemd/system /lib/systemd/system 2>/dev/null
find /etc/systemd /lib/systemd /usr/lib/systemd -writable -type f 2>/dev/null
```

What to look for:

- A root service whose `ExecStart` runs a script or binary the current user can write.
- A relative command in `ExecStart`, which resolves through `PATH` (see [PATH abuse](/methodology/privesc-linux/path-abuse/)).
- An `EnvironmentFile` or drop-in directory that a low-privilege account can modify.

## Step 4: Installed software and versions

```bash
dpkg -l | awk '/^ii/ {print $2, $3}'
rpm -qa --qf '%{NAME} %{VERSION}-%{RELEASE}\n'
sudo -V | head -n1
```

Use the package manager that matches the host. Record the versions of `sudo`, `polkit`, the shells, `screen`, `tmux`, `logrotate` and the kernel. Each has a public advisory history, so the version is the first filter for the [0-day quick reference](/methodology/privesc-linux/0day-quick-reference/).

## Step 5: Compare binaries with GTFOBins

```bash
ls -l /bin /usr/bin /usr/sbin
```

Copy the list of binary names to the attacker host and compare it there with a locally saved copy of the GTFOBins index. Keep the comparison off the target where possible, because the lookup itself needs network access and leaves traces. Any binary that appears in both lists is checked later under the sudo, SUID and capability conditions.

## Step 6: Behaviour and network context

```bash
strace -f -e trace=openat,execve COMMAND
ip a
cat /etc/hosts
route -n
arp -a
lastlog
w
```

Use `strace` only on programs you are permitted to run, and never attach it to a production daemon, because tracing stops the process. A privileged program that tries to open a library in a missing or writable path shows that path in the `openat` calls (see [Shared object hijacking](/methodology/privesc-linux/shared-object-hijacking/)).

The network commands show other hosts the target talks to, which may be useful for pivoting after root is obtained.

## What to look for

| Signal | Why it matters | Next page |
|---|---|---|
| Root service with a writable unit file or script | Code runs as root under attacker control | [Vulnerable services](/methodology/privesc-linux/vulnerable-services/) |
| Socket owned by root with group or world write | Shared session or control channel | [Vulnerable services](/methodology/privesc-linux/vulnerable-services/) |
| Binary on GTFOBins that runs as root or SUID | Built-in escape or file access | [Special permissions](/methodology/privesc-linux/special-permissions-suid/) |
| `strace` shows a root program opening a library from a writable path | Library load hijack | [Shared object hijacking](/methodology/privesc-linux/shared-object-hijacking/) |
| Vulnerable version with a public advisory | Possible 0-day path | [0-day quick reference](/methodology/privesc-linux/0day-quick-reference/) |

## Pitfalls

- Container hosts show a reduced process and socket view. Confirm which namespace you are in.
- Output from `ps` and `ss` depends on the account. A service account sees less than root does.
- `strace` may be blocked by the kernel's ptrace policy (`kernel.yama.ptrace_scope`), and the failure does not mean the program is safe.
- A version match is a lead, not a finding. Check whether a vendor backport has already fixed the flaw.

## Defense

Run each service under its own account with the fewest rights it needs. Keep unit files and their drop-in directories owned by root and not writable by others. Bind services to loopback where the design allows, and set restrictive permissions on sockets. Keep an inventory of installed packages and patch them on a schedule. See [Prevention and hardening](/methodology/privesc-linux/prevention/).
