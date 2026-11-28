---
layout: page
title: "Firewall Rule Testing"
subtitle: "Using ACK scans and rejection codes to tell stateful filtering from simple port blocks"
permalink: /methodology/network-scanning/firewall-rule-testing/
---

## Purpose

A filtered port tells you that something is blocking the probe, but not what. Firewall rule testing uses different probe types to learn how the filter behaves. An ACK scan is the main technique: it sends packets with only the ACK flag set, which a stateful firewall would normally treat as belonging to an existing connection. The results show whether the filter tracks connections, blocks by port, or drops packets by default.

## Rejection codes

When a firewall rejects a probe instead of dropping it, it can return an ICMP error. The code tells you what kind of rejection occurred:

| ICMP response | Meaning |
|---|---|
| Net unreachable | The network is not reachable through the filter |
| Net prohibited | The network is administratively blocked |
| Host unreachable | The host is not reachable |
| Host prohibited | The host is administratively blocked |
| Port unreachable | The port is rejected |
| Protocol unreachable | The protocol is rejected |

A dropped packet produces no reply at all, which is more common and gives less information.

## ACK scan theory

A stateful firewall tracks connections. A packet with only ACK set, with no prior SYN, is not part of any tracked connection, so the firewall can drop it or pass it to the host. If the host receives it, it replies with RST. Therefore:

- **RST reply:** the probe passed the firewall, so the port is `unfiltered`.
- **No reply, or ICMP unreachable:** the probe was blocked, so the port is `filtered`.

An ACK scan cannot determine whether a port is open. Run a SYN scan for that.

## Workflow

1. Run a SYN scan on the ports of interest to get the baseline view.

```bash
sudo nmap TARGET_IP -p 21,22,25 -sS -Pn -n --disable-arp-ping --packet-trace
```

2. Run an ACK scan on the same ports and compare.

```bash
sudo nmap TARGET_IP -p 21,22,25 -sA -Pn -n --disable-arp-ping --packet-trace
```

3. Interpret the combined results.

| Port | SYN scan | ACK scan | Interpretation |
|---|---|---|---|
| 21 | filtered | filtered | Blocked for both probe types |
| 22 | open | unfiltered | Allowed through the filter and reachable |
| 25 | filtered | filtered | Blocked; the SYN probe was dropped |

4. Where a port is `unfiltered` in the ACK scan, confirm the open state with a SYN or connect scan before reporting.

## What to look for

- Ports that show as filtered for SYN and unfiltered for ACK. These are open or allowed, and the firewall is likely stateless for that rule.
- ICMP unreachable replies with specific codes. These show the firewall rejects rather than drops.
- Mixed results across ports, which indicate port-specific rules.
- Inconsistent results between runs, which may indicate rate-based filtering.

> A stateless filter that allows ACK traffic lets a scanner map the rule set without completing a handshake. Document the rule type and the exact probes used, since the finding is about the filter configuration.
{: .info }

## Pitfalls

- `unfiltered` does not mean open. It means the probe reached the host.
- ACK scans require raw packet access, so they need root privileges.
- Rejections can come from a device other than the target, such as a router on the path. Consider the path before attributing the result.

## Defense and prevention

- Use a stateful firewall with a default-deny policy for inbound traffic.
- Drop unsolicited ACK packets that do not match a tracked connection, where the platform supports it.
- Log rejections and drops so that repeated scanning is visible.
- Use consistent rejection behaviour for ports that should not reveal their filter status.
