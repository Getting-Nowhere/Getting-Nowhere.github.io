---
layout: page
title: "NSE Scripts and Aggressive Scans"
subtitle: "Using the Nmap Scripting Engine categories safely and combining scans with -A"
permalink: /methodology/network-scanning/nse-scripts-and-aggressive-scan/
---

## Purpose

The Nmap Scripting Engine (NSE) extends Nmap with Lua scripts for discovery, version detection, authentication checks, and vulnerability identification. Scripts are grouped into categories, and the category tells you how risky a script is before you run it. Use the categories to choose scripts deliberately rather than running everything.

## Script categories

| Category | Description |
|---|---|
| `auth` | Determines authentication credentials or bypasses |
| `broadcast` | Host discovery by broadcast; results can feed later scans |
| `brute` | Attempts to log in to a service by brute force |
| `default` | Runs with `-sC`; a safe baseline set |
| `discovery` | Evaluates accessible services and resources |
| `dos` | Checks for denial-of-service weaknesses; can harm services |
| `exploit` | Attempts to exploit known vulnerabilities on the port |
| `external` | Sends data to third-party services for processing |
| `fuzzer` | Sends varied or malformed input to find unexpected behaviour; slow |
| `intrusive` | Can negatively affect the target system |
| `malware` | Checks whether a system is infected with known malware |
| `safe` | Designed not to perform intrusive or destructive actions |
| `version` | Extends service and version detection |
| `vuln` | Identifies specific known vulnerabilities |

## Workflow

1. Run the default script set with version detection on the ports you have already found. This is a reasonable baseline for any in-scope host.

```bash
sudo nmap TARGET_IP -p 80,443 -sC -sV
```

2. Run the vulnerability category against specific services. Use `-sV` so that the scripts receive the correct service context.

```bash
sudo nmap TARGET_IP -p 80 -sV --script vuln
```

3. Run an aggressive scan when a broad picture of one host is needed. `-A` enables service and OS detection, traceroute, and default scripts together. It is loud, so reserve it for hosts where that is acceptable.

```bash
sudo nmap TARGET_IP -A
```

4. Name the script or category explicitly when only one check is needed, rather than running a whole category.

## Decision points

- **Before running a category, read it.** `intrusive`, `brute`, `dos`, and `exploit` can change or disrupt the target. Run them only with explicit approval.
- **Start with `default` and `safe`.** These categories give useful information with a low impact.
- **Treat `vuln` results as leads.** Each finding must be confirmed with a targeted check before it is reported.
- **Use `-A` on individual hosts,** not on entire ranges, since its combined traffic is easy to spot.

> Scripts are only as accurate as their signatures and the service response. A script that reports a vulnerability has identified a possible condition, and manual verification is part of the method.
{: .warning }

## What to look for

- Script output that names a specific CVE, configuration weakness, or default credential. Record the script name and its output.
- Authentication methods offered by a service, such as anonymous access or weak schemes.
- Operating system details from `-A` that conflict with the banner. Investigate before relying on either.
- Traceroute results that reveal intermediate devices or filtering.

## Pitfalls

- Running `--script` against many ports at once multiplies the traffic and the chance of disruption.
- Some scripts require a service or version context. Run them without `-sV` and they may skip or report nothing useful.
- Aggressive options are obvious in IDS logs. Consider whether stealth matters for the assessment before using them.

## Defense and prevention

- Disable services and features that are not needed, since scripts can only identify what is exposed.
- Require authentication on management services and remove default accounts.
- Monitor for scanning patterns that match NSE vulnerability checks.
