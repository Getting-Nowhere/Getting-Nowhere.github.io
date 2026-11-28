---
layout: page
title: "Packet Tracing and Port States"
subtitle: "Classifying open, closed, and filtered ports by the packets that come back"
permalink: /methodology/network-scanning/packet-tracing-and-port-states/
---

## Purpose

Nmap's port states are conclusions drawn from the replies it receives. Packet tracing shows the exact probes sent and the replies received, so you can check a result instead of trusting it. Use it when a result is surprising, when a port appears filtered, or when you need evidence for a report.

## Port states

| State | Meaning |
|---|---|
| open | A service accepted the connection (TCP), or replied to the datagram (UDP) |
| closed | The host replied with a reset, so the port is reachable but nothing listens |
| filtered | Nmap cannot decide if the port is open; a firewall or filter is likely dropping probes |
| unfiltered | Reached by an ACK scan, but Nmap cannot tell whether it is open or closed |
| open\|filtered | Either open or filtered; common for UDP and for ports that send no reply |
| closed\|filtered | Either closed or filtered; only produced by IP ID idle scans |

## Why the noise is removed

Packet traces include extra traffic that hides the scan itself. These options remove it:

| Option | Removes |
|---|---|
| `-Pn` | Host discovery probes sent before the scan |
| `-n` | Reverse DNS queries |
| `--disable-arp-ping` | ARP requests on the local network |

## Workflow

1. Trace a single port with the noise removed.

```bash
sudo nmap TARGET_IP -p 21 --packet-trace -Pn -n --disable-arp-ping
```

2. Read the trace. The first line shows the probe sent and the second line shows the reply.

```text
SENT TCP ATTACKER_IP:SRC_PORT > TARGET_IP:21 S
RCVD TCP TARGET_IP:21 > ATTACKER_IP:SRC_PORT RA
```

A SYN answered with RST and ACK means the port is closed.

3. Trace a port that appears filtered. Add `--reason` to see the reason Nmap assigned.

```bash
sudo nmap TARGET_IP -p 139 --packet-trace -n --disable-arp-ping -Pn --reason
```

If there is no reply, Nmap retransmits. The default `--max-retries` is 10, so repeated probes with growing gaps between them suggest packets are being dropped.

4. Trace a port that returns an ICMP error. An ICMP unreachable message (type 3) with a code such as port unreachable (3) indicates a rejection, which is different from a silent drop. Check the rejection codes in [Firewall rule testing](/methodology/network-scanning/firewall-rule-testing/).

## Reading the evidence

| Observation | Likely state |
|---|---|
| SYN answered with SYN-ACK | Open |
| SYN answered with RST or RST-ACK | Closed |
| No reply, probes repeated with delay | Filtered (packets dropped) |
| ICMP unreachable reply | Filtered (packets rejected) |

> A port that returns ICMP unreachable is still a lead. The firewall is active on that port, so test other ports and other probe types to map the rule set.
{: .info }

## Pitfalls

- Packet traces are verbose. Limit them to a few ports, or write the output to a file for review.
- Without `-Pn`, host discovery can end the scan before any port probe is sent, so the trace shows no port activity.
- `filtered` does not mean the service is absent. The same port may be open from another source address.

## Defense and prevention

- Return explicit rejections only where needed. Silent drops slow scanning, while rejections reveal the presence of a filter, so choose the behaviour deliberately.
- Log dropped and rejected traffic, and alert when a single source probes many ports.
- Review firewall rules so each allowed port has a documented purpose.
