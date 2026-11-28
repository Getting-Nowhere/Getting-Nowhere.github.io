---
layout: page
title: "Firewall and IDS Evasion"
subtitle: "Nmap options that alter source address, source port, and probe volume to get past filters"
permalink: /methodology/network-scanning/firewall-and-ids-evasion/
---

## Purpose

Some hosts answer only specific sources, ports, or traffic patterns. Firewalls and intrusion detection systems (IDS) may also block or alert on a scan that is obvious. Evasion options in Nmap change how probes look so that the result reflects the real rule set rather than a blanket block. These techniques are used only when a filter is blocking legitimate assessment work and the rules of engagement allow testing the control itself. They make scans harder to attribute, so record every option used.

> Evasion options are a diagnostic tool, not a shortcut. Their use must be authorised, and each result should be interpreted with the probe type that produced it.
{: .warning }

## Technique overview

| Technique | Option | Filter it tests |
|---|---|---|
| Decoy scanning | `-D` | Blocks based on the source address of the scanner |
| Source address spoofing | `-S` with `-e` | Rules that allow traffic from specific sources |
| Source port selection | `--source-port` | Rules that allow traffic from specific ports, such as DNS |
| DNS proxying | `--dns-server` | Rules that allow traffic from a trusted resolver |
| Fragmentation and packet sizing | Packet-size options | Inspection that depends on packet structure |

## Workflow

### 1. Decoy scanning

Decoys mix fake source addresses into the probes, so the real scanner address is one among several. This helps when a subnet block is applied to the scanner address.

```bash
sudo nmap TARGET_IP -p 80 -sS -Pn -n --disable-arp-ping --packet-trace -D RND:5
```

`RND:5` generates five random decoy addresses and places the real address among them. Decoys must be live hosts. Dead decoys make the probes easy to spot and can look like a flood. Decoys do not hide the scanner's own return traffic, so they only change the apparent source.

### 2. Source address and interface

Use a different source address, and choose the interface that carries it. This tests whether a rule allows traffic from a specific source. Responses only reach you if you can see the traffic at that source, which usually limits this technique to a network position where you can observe replies.

```bash
sudo nmap TARGET_IP -n -Pn -p 445 -O -S SOURCE_IP -e INTERFACE
```

Operating system detection under filtering is unreliable. A result such as "aggressive OS guesses" with many candidates should not be reported as the OS.

### 3. Source port selection

Some firewalls trust traffic from well-known ports. Setting the source port to 53, the DNS port, can pass probes that a default source port would not.

```bash
sudo nmap TARGET_IP -p 50000 -sS -Pn -n --disable-arp-ping --packet-trace
sudo nmap TARGET_IP -p 50000 -sS -Pn -n --disable-arp-ping --packet-trace --source-port 53
```

A port that is filtered on the default source and open on source port 53 indicates a rule that trusts that source port. Confirm the service by connecting with the same source port:

```bash
ncat -nv --source-port 53 TARGET_IP 50000
```

### 4. DNS proxying

In a DMZ or a segment with restricted resolvers, Nmap can route its DNS lookups through a resolver that the host trusts. This matters for reverse-DNS lookups and for name resolution during scanning.

```bash
sudo nmap TARGET_IP -n --dns-server NAME_SERVER
```

Use `-n` to disable name resolution if DNS is not part of the test.

## What to look for

- A port that changes state when the source port or source address changes. This reveals a rule keyed to that attribute.
- A service that responds through the evasion path but not the default path. Report the bypass and the condition that allows it.
- Filtered responses that stay the same across all options. This suggests a default-deny policy that none of the techniques affect.

## Pitfalls

- Spoofed source addresses produce no visible replies unless you can see the traffic at that address.
- Decoys increase the number of packets sent, which makes the scan easier to detect, not harder.
- Changing several options at once makes it impossible to tell which one changed the result. Test one variable at a time.
- Timing and packet-size options can reduce IDS alerts, but they lengthen the scan. Balance against the assessment window.

## Defense and prevention

- Apply ingress and egress filtering, including anti-spoofing rules that reject packets with impossible source addresses.
- Do not trust traffic based only on its source port. Use stateful inspection and application-aware rules.
- Restrict DNS to approved resolvers and block direct outbound DNS from hosts that should not perform it.
- Tune IDS signatures to detect decoy-style scanning and changes in source port behaviour.
