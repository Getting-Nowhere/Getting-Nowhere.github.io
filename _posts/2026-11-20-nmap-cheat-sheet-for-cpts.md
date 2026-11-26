---
title: "Nmap Cheat Sheet for CPTS: From Host Discovery to Service Enumeration"
date: 2026-11-20 18:00:00 +0530
categories: [CPTS, Enumeration]
tags: [nmap, recon, enumeration, scanning]
description: The Nmap commands I reach for on every engagement. Host discovery, full port scans, service detection, scripts, output formats and firewall evasion basics.
---

> *Enumeration is the key.* Everything in a pentest depends on what you find here, so it pays to have a repeatable Nmap workflow you can run without thinking.

## Host Discovery

Before scanning ports, find out which hosts are alive. A ping sweep is the quickest way:

```bash
# ping sweep of a /24, no port scan
sudo nmap -sn 10.129.0.0/24 -oA scans/hosts

# from a list of targets
sudo nmap -sn -iL targets.txt
```

On a local network Nmap uses ARP, which is more reliable than ICMP. To force an ICMP echo and see the reasoning behind each result:

```bash
sudo nmap -sn -PE --disable-arp-ping --packet-trace 10.129.0.10
```

## Port Scanning

### Port states

| State             | Meaning                                                       |
| ----------------- | ------------------------------------------------------------- |
| `open`            | A service accepted the connection                             |
| `closed`          | Port reachable, nothing listening (RST received)              |
| `filtered`        | No response or an ICMP error, so a firewall is likely in the way |
| `unfiltered`      | Reachable but Nmap can't tell if it's open (ACK scan only)    |
| <code>open&#124;filtered</code> | No response, could be either (common with UDP)  |

### My default workflow

Scan fast first, then go deep only on what's open:

```bash
# 1. all TCP ports, quickly
sudo nmap -p- --min-rate 5000 -T4 -oN scans/allports 10.129.0.10

# 2. pull the open ports into a variable
ports=$(grep -oP '^\d+(?=/tcp\s+open)' scans/allports | paste -sd,)

# 3. detailed scan on those ports only
sudo nmap -p"$ports" -sC -sV -oA scans/detailed 10.129.0.10
```

> `--min-rate 5000` is fine in a lab, but it can miss ports or knock over fragile hosts on a real engagement. Slow down when in doubt.
{: .warning }

### UDP

UDP is slow, so scan only the most common ports:

```bash
sudo nmap -sU --top-ports 100 -oN scans/udp 10.129.0.10
```

## Service and Version Detection

```bash
# version detection + default scripts
nmap -sV -sC -p 22,80,445 10.129.0.10

# aggressive: OS, version, scripts, traceroute
nmap -A 10.129.0.10
```

### Useful NSE scripts

```bash
# list scripts for a service
ls /usr/share/nmap/scripts | grep -i smb

# run a specific script, or a whole category
nmap -p445 --script smb-os-discovery 10.129.0.10
nmap -p80 --script "http-enum,http-headers" 10.129.0.10
nmap -p21 --script ftp-anon 10.129.0.10
```

## Output Formats

| Flag  | Output                              |
| ----- | ----------------------------------- |
| `-oN` | Normal text                         |
| `-oG` | Greppable                           |
| `-oX` | XML (import into other tools)       |
| `-oA` | **All three** at once, my default   |

## Firewall and IDS Evasion Basics

```bash
# decoys
sudo nmap -p80 -sS -D RND:5 10.129.0.10

# trusted source port (e.g. DNS)
sudo nmap -p50000 -sS --source-port 53 10.129.0.10

# fragment packets
sudo nmap -f 10.129.0.10
```

> Use evasion options only when the engagement allows it. They make scans slower and noisier in other ways.
{: .info }

## Quick Reference

1. Host discovery with `-sn`
2. Full TCP sweep with `-p-`
3. Version and scripts on open ports with `-sC -sV`
4. Don't forget UDP (`-sU --top-ports`)
5. Always save output with `-oA`
