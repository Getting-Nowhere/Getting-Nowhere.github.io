---
layout: page
title: "Linux Shells"
subtitle: "Profiling a Linux target and turning a foothold into an interactive shell"
permalink: /methodology/shells-and-transfers/linux-shells/
---

**Purpose:** when the foothold is on a Linux host, collect the facts that shape the next step, then obtain or upgrade to an interactive shell using whatever interpreter the host provides.

## Workflow

1. Enumerate the host and its services. A service version scan is the usual starting point:

```bash
nmap -sC -sV TARGET_IP
```

2. Record the answers to the questions that drive shell choice:
   - Which distribution and version is running?
   - Which shells and programming languages are installed?
   - What role does the system play on the network?
   - Which application is it hosting?
   - Are there known vulnerabilities in those components?
3. Match the findings to an exploit. If the exploit is not already in Metasploit, download it from a trusted source and place it where the framework can load it, then use it as a module.
4. After access is gained, spawn an interactive shell if the initial one is restricted.

## Spawning an interactive shell

The following one-liners use an interpreter already on the target to start `/bin/sh`:

```bash
/bin/sh -i
```

```bash
perl -e 'exec "/bin/sh";'
```

```bash
ruby -e 'exec "/bin/sh"'
```

```bash
lua -e 'os.execute("/bin/sh")'
```

```bash
awk 'BEGIN {system("/bin/sh")}'
```

```bash
find / -name nameoffile -exec /bin/awk 'BEGIN {system("/bin/sh")}' \;
```

```bash
find . -exec /bin/sh \; -quit
```

```bash
vim -c ':!/bin/sh'
```

If `vim` is available but the command above is not accepted, open the file in vim and set the shell from inside the editor:

```text
:set shell=/bin/sh
:shell
```

## Decision points

| Observation | Next step |
|---|---|
| Perl, Ruby, Lua or AWK is present | Use the interpreter one-liner to start `/bin/sh` |
| A file-search or vim binary is reachable with an unrestricted shell | Use the `find` or `vim` form |
| Only a restricted shell is available | Spawn `/bin/sh -i` from the restricted environment if the binaries allow it |
| No interpreter is available | Fall back to a compiled stageless payload or a transfer-based method |

> Note the shape of the `find` command. The form `find . -exec /bin/sh \; -quit` is the one that works. The `-exec` flag must precede the command.
{: .tip }

## What to look for

- The shell user and group, and whether `sudo` is available
- The environment variables reported by `env`, which show the language and locale in use
- Whether the shell is interactive. A non-interactive shell cannot run tools that prompt for input.

## Pitfalls

- Some Linux hosts are configured with an unusual shell. Confirm the binary path before relying on a one-liner.
- A shell that appears to work can drop on the first interactive prompt. Test with a simple command before running long tasks.
- Exploits from third-party sources are untrusted code. Read them before running them against a target.

## Defense and prevention

Remove unneeded interpreters from production servers, restrict sudo rules to what is required, and keep applications patched. Monitoring for interpreter processes that spawn shells, and for shells running under web-server accounts, provides early warning.
