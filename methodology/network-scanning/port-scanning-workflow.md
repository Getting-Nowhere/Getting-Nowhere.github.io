---
layout: page
title: "Port Scanning Workflow"
subtitle: "Choosing TCP scan types and ports, with a repeatable order of operations"
permalink: /methodology/network-scanning/port-scanning-workflow/
---

## Purpose

Port scanning shows which services listen on a host. This page covers the workflow: a quick scan to see something early, a full TCP scan to be thorough, a UDP scan for the services TCP misses, and saved output for every run.

## Scan types

| Option | Scan | Handshake | Requirement | Notes |
|---|---|---|---|---|
| `-sS` | SYN scan | Sends SYN, never completes the handshake | Root or administrator | Default when run as root; fast and less likely to be logged by the application |
| `-sT` | Connect scan | Completes the three-way handshake | None | Default for non-root users; most reliable, but logged by many services and IDS |
| `-sU` | UDP scan | None (UDP is stateless) | Root | Slow; empty datagrams may leave ports open or filtered |
| `-sA` | ACK scan | Sends ACK only | Root | Maps firewall rules, not port state (see [Firewall rule testing](/methodology/network-scanning/firewall-rule-testing/)) |

## Workflow

1. Start with the top ports on each live host to get early results.

```bash
sudo nmap TARGET_IP --top-ports=10
```

2. Run a full TCP scan once the initial results are known. Use a SYN scan when root is available; otherwise use a connect scan.

```bash
sudo nmap TARGET_IP -p- -sS
nmap TARGET_IP -p- -sT
```

3. Scan UDP for the most important ports. A fast UDP scan of common ports is useful, but a full UDP scan is slow.

```bash
sudo nmap TARGET_IP -F -sU
```

4. Add `-Pn` when host discovery is blocked and you still want to scan. This skips the ping probes.

5. Save results in every format so that later tools can parse them.

```bash
sudo nmap TARGET_IP -p- -sS -oA full_tcp
```

`-oA` writes normal (`.nmap`), grepable (`.gnmap`), and XML (`.xml`) output.

## Reading the results

- **open:** a service accepted the connection or replied.
- **closed:** the host replied with a reset, so the port is reachable but nothing listens.
- **filtered:** no conclusive reply, which usually means a firewall dropped the probe.

Each state is explained in [Packet tracing and port states](/methodology/network-scanning/packet-tracing-and-port-states/).

## What to look for

- Unusual open ports on expected hosts, such as a database port exposed to a segment that should not reach it.
- Ports that are open on TCP but filtered on UDP, or the reverse.
- Hosts where the top-port scan finds nothing but the full scan finds services. Do not stop at the top ports.
- A mix of open and filtered ports on the same host, which indicates per-port firewall rules.

> A SYN scan is usually preferred over a connect scan for speed and lower application-level logging. Use a connect scan when raw packets are not available, and note in the report which scan type was used.
{: .tip }

## Pitfalls

- Full TCP scans of many hosts take a long time. Plan the run and use timing options (see [Performance tuning](/methodology/network-scanning/performance-tuning/)).
- UDP scans rarely receive replies from open ports. Results often show `open|filtered`, which requires follow-up with service-specific probes.
- Running a connect scan on a host with rate-limited logging can flood application logs. Confirm this is acceptable within scope.

## Defense and prevention

- Expose only required ports, and close unused ones.
- Use a default-deny firewall policy for both TCP and UDP.
- Monitor for SYN scans and rapid sequential port access from one source.
