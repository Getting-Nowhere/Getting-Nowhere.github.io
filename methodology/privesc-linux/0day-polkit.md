---
layout: page
title: "0-day: Polkit pkexec"
subtitle: "Memory corruption in pkexec (CVE-2021-4034) and a check for policy misconfiguration first"
permalink: /methodology/privesc-linux/0day-polkit/
---

Polkit (PolicyKit) is the authorisation service that decides whether a user or process may perform a privileged action. `pkexec` is its command for running a program as another user, most often root. CVE-2021-4034, also known as PwnKit, is a memory corruption flaw in `pkexec` that lets any local user gain root on affected builds. This page explains how polkit grants rights, how to check for the flaw, and how to separate a configuration issue from a 0-day. It does not include exploit code.

> A misconfigured polkit rule that grants a low-privilege user administrative actions is a configuration finding and is safer to demonstrate and fix. Check policy before you check the CVE.
{: .tip }

## How polkit grants rights

Polkit reads its rules from three places:

| Location | Contents |
|---|---|
| `/usr/share/polkit-1/actions` | Action definitions and default authorisation levels |
| `/usr/share/polkit-1/rules.d` | JavaScript rules that allow or deny actions |
| `/etc/polkit-1/localauthority/50-local.d` | Local `.pkla` overrides for users and groups |

Three helper programs are installed with polkit:

- `pkexec` runs a command as another user.
- `pkaction` lists actions and their defaults.
- `pkcheck` tests whether a process is authorised for an action.

## Workflow

1. Check the policy first. A rule that lets the current user run `pkexec` for any command is a configuration issue.

```bash
pkaction --verbose | less
ls -l /etc/polkit-1/rules.d /usr/share/polkit-1/rules.d 2>/dev/null
ls -l /etc/polkit-1/localauthority/50-local.d 2>/dev/null
grep -rl "allow\|return polkit.Result.YES" /etc/polkit-1/rules.d 2>/dev/null
```

2. Check whether `pkexec` is installed with the SUID bit and which version it is.

```bash
ls -l /usr/bin/pkexec
pkexec --version
```

3. Check the package version against the vendor advisory for CVE-2021-4034.

```bash
dpkg -l policykit-1 polkitd 2>/dev/null | awk '/^ii/ {print $2, $3}'
rpm -q polkit
```

4. Record the result. A vulnerable build that is reachable by any local account is a finding even when no policy misconfiguration exists.

## What to look for

| Signal | Interpretation |
|---|---|
| Local rule that returns `YES` for a broad action | Configuration finding. Report and fix the rule |
| `pkexec` with the SUID bit and an unpatched version | Exposed to CVE-2021-4034 |
| Patched package with the SUID bit | Not exposed to this CVE. Keep the policy review |
| `pkexec` absent | Polkit not installed. Move to other checks |

The upstream project fixed the flaw in polkit `0.120`. Distributions shipped backported builds with their own version strings, so compare with the vendor advisory.

## Pitfalls

- Running `pkexec` with a command to test it is an action on the host. Use the version and policy checks instead.
- A password prompt from `pkexec` does not rule out exposure. Check whether the account that can reach the prompt has credentials, or whether a rule grants the action without one.
- Old polkit versions may coexist with newer libraries on some hosts. Check the binary that is actually run, using `which pkexec`.

## Defense

Update polkit to a fixed build from the distribution. Keep the SUID bit only where the service needs it. Write local rules with the narrowest action and group match, and avoid returning `YES` for broad actions. Require administrator authentication for privileged actions rather than allowing them to a whole user group. Monitor changes to `/etc/polkit-1` and `/usr/share/polkit-1` with file integrity monitoring.

See also [Sudo rights abuse](/methodology/privesc-linux/sudo-rights-abuse/) for the same policy question in sudo, the [0-day quick reference](/methodology/privesc-linux/0day-quick-reference/), and [Prevention and hardening](/methodology/privesc-linux/prevention/).
