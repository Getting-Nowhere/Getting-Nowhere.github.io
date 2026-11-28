---
layout: page
title: "LLMNR and NBT-NS Poisoning"
subtitle: "Capture NTLMv2 challenge responses by answering name-resolution broadcasts"
permalink: /methodology/active-directory/llmnr-nbt-ns-poisoning/
---

LLMNR and NBT-NS are fallback name-resolution protocols. When a Windows host cannot resolve a name through DNS, it broadcasts the query on the local network and accepts any answer. An attacker on the same segment can answer for any name, and the victim sends its NTLM authentication to the attacker. That response can be cracked offline or relayed to another host. This page covers the tools, the capture process, and the fix. It only applies to a segment you are authorized to test.

## Primer

- LLMNR uses UDP port `5355`.
- NBT-NS uses UDP port `137`.
- Both run only when DNS fails to resolve a name, which happens often with typos, mapped drives to old servers, and stale shortcuts.
- The captured material is a NetNTLMv2 response, which is not the password itself. It can be cracked with hashcat mode `5600` or relayed with SMB relay tooling.

## Workflow

1. Confirm the segment and the rules of engagement allow poisoning.
2. Start in analyze mode to see which names are being queried without answering them.
3. Switch to poisoning mode only if the rules allow it, and capture hashes.
4. Crack the captured NetNTLMv2 hashes offline, or hand them to a relay tool.
5. Validate any recovered password with a single authentication.

## Tools

| Tool | Notes |
|---|---|
| Responder | Purpose-built to poison LLMNR, NBT-NS, and mDNS |
| Inveigh | PowerShell and C# man-in-the-middle platform covering LLMNR, NBT-NS, DNS, mDNS, HTTP, SMB, and LDAP |
| Metasploit | Built-in scanners and spoofing modules |

## Step 1: Responder from Linux

```bash
sudo responder -I INTERFACE -A
```

The flags used in the notes are:

- `-A`: analyze mode. Shows LLMNR and NBT-NS requests without answering them. Start here.
- `-w`: uses the WPAD rogue proxy, which captures HTTP requests from users who launch Internet Explorer.
- `-f`: fingerprints the remote host OS and version.
- `-F` and `-P`: force NTLM or basic authentication for HTTP and proxy requests. These can cause a visible login prompt, so use them only when needed.

Cracking the captured hash:

```bash
hashcat -m 5600 captured_hashes.txt /usr/share/wordlists/rockyou.txt
```

## Step 2: Inveigh from Windows

```powershell
Import-Module .\Inveigh.ps1
(Get-Command Invoke-Inveigh).Parameters
Invoke-Inveigh Y -NBNS Y -ConsoleOutput Y -FileOutput Y
```

The PowerShell version enables the common protocols by default. Items marked with a bracket in its console output are disabled. In the C# version, view captured material with:

```text
GET NTLMV2UNIQUE
GET NTLMV2USERNAMES
```

The C# version must be compiled before use.

## What to look for

- Usernames and NTLMv2 responses from hosts that are not on your target list
- Frequent broadcast requests for names that do not exist, which point to a stale share or a misconfigured script
- SMB hosts that do not require signing, which are candidates for relay

## Pitfalls

- Poisoning is noisy. Run analyze mode first, and keep poisoning windows short.
- A captured NetNTLMv2 hash is not a password. It must be cracked or relayed before it is useful.
- If the rules of engagement do not allow man-in-the-middle activity, record the broadcast traffic as a finding and move on.

> Poisoning answers network traffic from other users and machines. Confirm written permission for the segment before you start, and stop as soon as you have enough material.
{: .warning }

## Defense

MITRE classifies this as adversary-in-the-middle through LLMNR/NBT-NS poisoning and SMB relay. The main control is to turn these protocols off.

- Disable LLMNR through Group Policy.
- NBT-NS cannot be disabled directly with Group Policy, so set `NetbiosOptions` to `2` on each interface with a script:

```powershell
$regkey = "HKLM:\SYSTEM\CurrentControlSet\services\NetBT\Parameters\Interfaces"
Get-ChildItem $regkey | foreach { Set-ItemProperty -Path "$regkey\$($_.pschildname)" -Name NetbiosOptions -Value 2 -Verbose }
```

Also enable SMB signing and restrict NTLM where possible, so captured responses cannot be relayed.
