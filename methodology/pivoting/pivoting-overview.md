---
layout: page
title: "Pivoting Overview"
subtitle: "Terms, mapping a pivot host's networks, and choosing a technique"
permalink: /methodology/pivoting/pivoting-overview/
---

This page separates three activities that follow initial access (lateral movement, pivoting and tunnelling), shows how to read a pivot host's interfaces and routes, and gives a decision table for choosing a technique. Mapping the pivot first prevents wasted tunnels, since most failures come from routing the wrong subnet or assuming a protocol is allowed when it is not.

## Terms

1. **Lateral movement** extends access to other hosts, applications or services in the environment, usually with credentials already obtained.
2. **Pivoting** uses a host under the tester's control as a relay across a boundary that is not directly reachable.
3. **Tunnelling** hides traffic inside an allowed protocol (HTTP(S), DNS or ICMP, for example) for command and control or data movement.

A dual-homed host, with NICs on two networks, is the usual pivot point because it can see both sides of a boundary.

## Workflow

1. Record the current user, privilege level and any VPN or remote access software on the host.
2. List interfaces. On Linux use `ifconfig`. On Windows use `ipconfig`.
3. Identify the networks on each NIC. A `tun0` interface usually indicates a VPN tunnel.
4. Read the routing table with `netstat -r` on Linux or `route print` on Windows.
5. Note the subnets reachable only through the pivot. These are the pivot targets.
6. Test which protocols leave the pivot (SSH, ICMP echo, DNS, HTTP(S)) before choosing a tunnel.

```bash
attacker$ ifconfig
attacker$ netstat -r
```

```powershell
PS C:\> ipconfig
PS C:\> route print
```

## Decision table

| Situation | Technique | Notes |
|---|---|---|
| SSH access to the pivot | SSH `-L`, `-D` or `-R` | No extra binary needed on the pivot |
| SSH access and many tools need routes | sshuttle | Routes whole subnets; needs root on the attack host |
| Only ICMP echo leaves the network | ICMP tunnel (ptunnel-ng) | Requires ping replies to be allowed |
| Only DNS leaves the network | dnscat2 | Slow; suited to small amounts of data |
| Firewall allows HTTP(S) or a single tunnel port | Chisel | SOCKS5 over an HTTP-based tunnel; reverse mode for inbound-blocked hosts |
| Windows pivot, no SSH client | netsh, Plink, SocksOverRDP | Native or lightweight Windows options |
| Inbound blocked to target, outbound HTTP allowed | rpivot or reverse Chisel | Target connects out to the attack host |

## What to look for

- A second NIC or a route to a subnet the attack host cannot reach. This is the decision point for any pivot.
- Outbound filtering. If the pivot cannot make outbound SSH, tunnel over an allowed protocol.
- Whether the tool being run needs raw ICMP or full TCP. Proxy-based tools carry TCP only.

## Pitfalls

> Route only the subnet you need. Broad routes add noise and make detection easier.
{: .warning }

- ICMP host discovery does not traverse a SOCKS proxy. Use TCP connect scans through proxies (`-Pn -sT`).
- Record every listener and tunnel you start on the pivot so they can be removed at the end of the engagement.

## Defense and prevention

Restrict outbound traffic from servers and workstations to required destinations, and log or block ICMP and DNS to unapproved resolvers. Disable SSH TCP forwarding for accounts that do not need it, and monitor for unexpected listeners on high ports.