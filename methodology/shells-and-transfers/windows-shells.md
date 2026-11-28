---
layout: page
title: "Windows Shells"
subtitle: "Fingerprinting a Windows host and choosing the payload type and interpreter"
permalink: /methodology/shells-and-transfers/windows-shells/
---

**Purpose:** identify the Windows host, choose the payload format and interpreter that the host can run, and generate or stage the payload with the least friction.

## Workflow

1. Fingerprint the host. A default TTL of 128 is typical of Windows, and the notes also reference 32. An Nmap OS scan confirms the result:

```bash
nmap -O -A TARGET_IP
```

2. Choose a payload container that the target will execute:
   - **DLL**: for injection or library hijacking. Used with care, since it can elevate privilege or bypass UAC when a suitable library is loaded by a privileged process.
   - **Batch file (.bat)**: a plain-text DOS script that can open a port or connect back.
   - **VBS**: a lightweight script based on Visual Basic.
   - **MSI**: an installer package that can carry a payload and is run through `msiexec`.
   - **PowerShell**: a shell and scripting environment on the .NET runtime that passes .NET objects, not plain text.
3. Generate the payload using a tool from the table below.
4. Start the listener, then deliver and run the payload.

```powershell
msiexec /q /i payload.msi
```

## Payload generation tools

| Resource | Use |
|---|---|
| MSFVenom and Metasploit Framework | Enumeration, payload generation, exploits and post-exploitation |
| Payloads All The Things | Cheat sheets for payload generation and methodology |
| Mythic C2 | Alternative command-and-control framework with custom payload generation |
| Nishang | Collection of offensive PowerShell scripts and implants |
| Darkarmour | Generates and uses obfuscated Windows binaries |

## Delivery options

- **Impacket** tools such as `psexec`, `smbclient` and `smbserver` deliver and run payloads over SMB, which suits domain-joined hosts that share data.
- **SMB shares** are the natural delivery path when the host is domain joined and uses shares.

## CMD or PowerShell

| Use CMD when | Use PowerShell when |
|---|---|
| The host is old and may not include PowerShell | Cmdlets or custom scripts are needed |
| Only simple interaction is needed | Working with .NET objects rather than text is useful |
| Batch files, `net` commands or native MS-DOS tools are enough | Stealth is less important than capability |
| Execution policy may block scripts | The work involves cloud services or aliased scripts |

> The execution policy can block scripts from running. Determine the policy before assuming a script will execute.
{: .info }

## What to look for

- Whether PowerShell is present and which version it reports
- Whether the target runs endpoint protection, and whether the payload will be flagged on delivery
- Whether the current user has administrative rights, which affects which payload types will persist and run

## Pitfalls

- Windows Defender can block a one-liner or a script before it runs. Changing Defender settings, for example by disabling real-time monitoring with `Set-MpPreference`, requires administrative rights and is a highly visible action. Use it only where the rules of engagement allow it and record it.
- Execution policy errors are often mistaken for network errors. Read the error text before changing the approach.
- A payload built for the wrong architecture fails silently. Confirm x86 or x64 on the target.

> Disabling security controls is a detectable change to the host. Document the change and reverse it when the test is complete.
{: .warning }

## Defense and prevention

Restrict PowerShell with constrained language mode or policy where practical, enable script block logging, and keep endpoint protection running with real-time monitoring. Restrict which users can write to locations where MSI and batch files would be executed.
