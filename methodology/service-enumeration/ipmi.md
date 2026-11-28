---
layout: page
title: "IPMI"
subtitle: "Baseboard management controllers, default credentials and RAKP hash exposure on UDP 623"
permalink: /methodology/service-enumeration/ipmi/
---

## Purpose

The Intelligent Platform Management Interface (IPMI) gives administrators out-of-band control of a server through its baseboard management controller (BMC). It works even when the operating system is down or powered off. That independence is what makes it valuable to administrators and dangerous when exposed. This page covers how to locate IPMI, test default credentials and capture IPMI 2.0 password material for offline work.

## Background

IPMI is used in three main ways:

- Before the operating system boots, to change BIOS or firmware settings.
- When the host is fully powered down, for remote power control.
- To regain access after a system failure.

When not performing these tasks, the BMC monitors temperature, voltage, fan status and power supplies. BMCs typically run their own network stack, so they are often reachable on a management network even when the host itself is not.

## Enumeration steps

### 1. Confirm the service and version

```bash
sudo nmap -sU -p 623 --script ipmi-version TARGET_IP
```

IPMI runs over UDP, so scan with `-sU`. UDP results can be unreliable, so repeat the scan if the port appears closed.

### 2. Confirm with Metasploit

```text
use auxiliary/scanner/ipmi/ipmi_version
set RHOSTS TARGET_IP
run
```

### 3. Test vendor default credentials

| Product | Default username | Default password |
| --- | --- | --- |
| Dell iDRAC | root | calvin |
| HP iLO | Administrator | Randomised eight-character string of digits and uppercase letters, usually printed on the device |
| Supermicro IPMI | ADMIN | ADMIN |

Check the vendor documentation for the firmware version in scope before testing, because defaults change between releases. Stop after a small number of attempts to avoid lockouts.

### 4. Dump IPMI 2.0 password hashes

```text
use auxiliary/scanner/ipmi/ipmi_dumphashes
set RHOSTS TARGET_IP
run
```

The module retrieves salted password hashes during the RAKP authentication exchange in IPMI 2.0, even when the default credentials fail. Useful options include `CRACK_COMMON` (test common passwords automatically), `OUTPUT_HASHCAT_FILE` and `OUTPUT_JOHN_FILE` (save the hashes in a cracking format), `PASS_FILE` and `USER_FILE`.

### 5. Crack offline

```bash
hashcat -m 7300 hash.txt -a 3 ?1?1?1?1?1?1?1?1 -1 ?d?u
```

Hashcat mode 7300 is the IPMI 2.0 RAKP format. The example is a mask attack for an eight-character password drawn from digits and uppercase letters, which matches the iLO default pattern. Use a wordlist or rule-based attack when the mask is not known.

> A recovered hash that cracks to a vendor default is strong evidence of a configuration weakness. Report the credential as a default rather than as a password guess.
{: .info }

## What to look for

- BMC addresses reachable from user networks, the internet or non-management VLANs.
- Default credentials that still work, particularly on iDRAC, iLO and Supermicro devices.
- Hashes that crack quickly, which indicates a short or common password.
- Firmware versions with known weaknesses, confirmed against the vendor advisory.

## Pitfalls

- **BMC access is high impact.** Virtual media, power control and console access all become available with a valid login. Confirm scope before interacting beyond version checks.
- **Account lockouts** can disable management access for administrators. Limit attempts and record each one.
- **UDP scanning** is slower and less reliable than TCP. A missing response does not prove the service is absent.
- **Offline cracking** depends on the wordlist. An unsuccessful run means the password was not in the list, not that it is strong.

## Defense and prevention

Place BMC interfaces on a dedicated management network that is not reachable from user or internet segments. Change all default credentials at deployment, use unique passwords per device, keep firmware current, and disable IPMI over LAN on hosts that do not need remote management. Restrict UDP port 623 to administrative hosts.
