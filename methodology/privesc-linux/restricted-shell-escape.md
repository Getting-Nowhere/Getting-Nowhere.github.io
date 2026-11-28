---
layout: page
title: "Restricted Shell Escape"
subtitle: "Recognising restricted shells and checking for ways out of them"
permalink: /methodology/privesc-linux/restricted-shell-escape/
---

A restricted shell limits what an account can do: changing directory, setting variables, running commands outside an approved list. It is a control to reduce exposure, not a security boundary, and many restrictions can be bypassed when the shell passes input to other programs or trusts variables it does not protect. This page covers identifying the restricted shell, the classes of escape, and what to do with a successful escape.

## Workflow

1. Identify the shell and what it restricts.
2. Check which commands are allowed and which programs the shell can launch.
3. Test the escape classes in order of how invasive they are.
4. Once free of the restriction, return to the standard phases of enumeration.

## Step 1: Identify the shell

```bash
echo $SHELL
echo $0
cat /etc/passwd | grep "rbash\|rksh\|rzsh"
cat /etc/shells
```

`/etc/shells` lists the valid login shells on the host, including any restricted variants. The shell assigned to the account in `/etc/passwd` is the one that applies.

| Shell | Typical restrictions |
|---|---|
| rbash | No `cd`, no changing `PATH`, `SHELL` or `HOME`, no commands containing `/`, no output redirection |
| rksh | Commands only in permitted directories, no creating or changing shell functions, restricted environment changes |
| rzsh | No running shell scripts, no defining aliases, restricted environment changes |

Restrictions differ between builds. Test rather than assume.

## Step 2: Check what the environment allows

Confirm which programs are available from inside the shell. Terminal multiplexers such as `tmux` and `screen` that appear in `/etc/shells` or on disk are useful: they can launch another shell if their own arguments are not restricted.

## Step 3: Escape classes

### Command injection through arguments

If the shell permits one allowed command with user-supplied arguments, check whether the arguments are passed to a shell that interprets metacharacters. Test with a harmless command first.

### Command substitution

Some restricted shells allow a command whose argument is expanded by a shell that is not restricted. Substitution syntax (backticks or `$(...)`) is evaluated before the outer command runs.

### Command chaining

If a permitted command passes input to a shell, a separator such as `;`, `|` or `&&` can start a second command. Test with a benign separator and a visible output.

### Environment variables

If the restricted shell relies on `SHELL`, `PATH`, `HOME` or `BASH_ENV` and the account can change them, a different shell or search path may be used. Check first whether the variable can be changed at all:

```bash
export SHELL=/bin/bash
bash
```

Changing `PATH` or `BASH_ENV` to point to a writable location is an escape technique that depends on the shell reading that location.

### Shell functions

Shells that allow functions can define a function that calls an unrestricted program. This works where function definition is permitted but the restriction is applied only to command names typed at the prompt.

## Step 4: Confirm the escape

After an escape, confirm the new shell's identity and whether the restriction is really gone:

```bash
id
echo $SHELL
cd /
```

If `cd` now works, the restriction has been removed for the session. Re-run the phase-1 enumeration from this new shell because command availability will have changed.

## What to look for

- A restricted shell assigned to an account that also has a sudo rule, a group membership or SSH access that can run a different shell.
- Variables such as `SHELL` or `PATH` that the account can set.
- Permitted commands that accept arguments, pipes or scripts.
- Terminal multiplexers available inside the restricted environment.

## Pitfalls

- A restricted shell can be tested in a different way over SSH (remote command execution with a TTY) than in a local session. Note the access method used.
- Restricted shells often remove the commands used for enumeration. Plan for missing tools and use shell builtins where possible.
- Some escapes change the state of the environment and can be logged. Record the steps and the time they were taken.
- Do not use escape payloads that open reverse connections unless the engagement rules allow outbound connections from the target.

## Defense

- Do not rely on restricted shells as a security control. Treat them as a convenience layer.
- Do not allow restricted users to execute permitted commands with arguments that pass to a shell.
- Make `SHELL`, `PATH` and `BASH_ENV` read-only for the account, and set `PATH` in a root-owned profile.
- Remove terminal multiplexers and shells that the restricted account does not need from `/etc/shells` and from the file system where possible.
- Use `rbash` only in combination with a mandatory access control policy or a container boundary.
