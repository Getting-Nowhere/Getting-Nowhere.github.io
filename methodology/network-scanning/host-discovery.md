---
layout: page
title: "Host Discovery"
subtitle: "Finding live systems with ping sweeps, ICMP echo, and ARP before port scanning"
permalink: /methodology/network-scanning/host-discovery/
---

## Purpose

Host discovery identifies which addresses in a range are live before any port scanning begins. Scanning dead addresses wastes time and creates noise. Nmap's host discovery mode (`-sn`) skips port scanning and only determines which hosts respond.

## How the probes work

On a local network Nmap uses ARP requests by default, because they are reliable. Across routed networks it uses ICMP echo requests (`-PE`). If a probe receives a reply, the host is considered up. A host that does not respond may still be up, because a host firewall can drop ICMP.

## Workflow

1. Sweep a subnet with host discovery only. `-oA` saves the output in normal, grepable, and XML formats. The pipeline extracts the addresses of hosts that responded.

```bash
sudo nmap TARGET_NET/24 -sn -oA tnet | grep for | cut -d" " -f5
```

2. Sweep a list of addresses from a file.

```bash
sudo nmap -sn -oA tnet -iL hosts.lst | grep for | cut -d" " -f5
```

3. Check a small set of explicit addresses.

```bash
sudo nmap -sn -oA tnet TARGET_IP1 TARGET_IP2 TARGET_IP3
```

4. Investigate a single host and show why it was marked up. `--packet-trace` prints each probe and reply, and `--reason` gives the reason for each result.

```bash
sudo nmap TARGET_IP -sn -oA host -PE --packet-trace
sudo nmap TARGET_IP -sn -oA host -PE --reason
```

5. Force ICMP-only discovery by disabling ARP probes. This is useful when the local ARP behaviour hides the real result.

```bash
sudo nmap TARGET_IP -sn -oA host -PE --packet-trace --disable-arp-ping
```

A sample packet trace shows the echo request sent and the echo reply received:

```text
SENT (0.0107s) ICMP [ATTACKER_IP > TARGET_IP Echo request (type=8/code=0)]
RCVD (0.0152s) ICMP [TARGET_IP > ATTACKER_IP Echo reply (type=0/code=0)]
```

## What to look for

- Hosts that respond to ICMP but show no open ports later, which may be policy-filtered.
- Addresses that respond to ARP but not to ICMP, which suggests ICMP is blocked by the host.
- Unexpected addresses in the list, which may belong to other organisations or to shared infrastructure.

> A host that does not reply is not proven to be down. Repeat discovery with a different probe type before excluding it from later scans.
{: .warning }

## Pitfalls

- ICMP-based discovery depends on host firewall policy. A host can be live but silent.
- ARP discovery only works on the local segment. Scans across routers need ICMP or port-based probes.
- Sweeping large ranges generates a large burst of traffic. Keep ranges within the agreed scope and check rate limits.

## Defense and prevention

- Apply a consistent host firewall policy. Blocking ICMP reduces discovery, but it does not replace protecting each service.
- Segment networks so that only required hosts are reachable from untrusted zones.
- Monitor for sweeps across many addresses from a single source.
