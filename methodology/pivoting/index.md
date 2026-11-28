---
layout: page
title: "Pivoting and Tunnelling"
subtitle: "Section index: reaching networks behind a compromised host through SSH, SOCKS, Meterpreter and other tunnels"
permalink: /methodology/pivoting/
---

Pivoting uses a compromised host as a relay so that traffic can reach network segments the attack host cannot route to directly. Tunnelling wraps that traffic inside a protocol the network already allows, such as SSH, HTTP, ICMP or DNS, so that it passes filters and inspection. This section covers the first questions to answer after initial access (which networks the host can see and what it is allowed to talk to), then one page per technique: SSH forwarding in each direction, Meterpreter routing, Chisel, ICMP and DNS tunnels, sshuttle, Windows-native forwarding, Plink, rpivot, and chained or double pivots.

Placeholders used throughout: `ATTACKER_IP` (the attack host), `PIVOT_IP` (the pivot host's externally reachable address), `PIVOT_INTERNAL_IP` (the pivot's address on the internal network), `TARGET_IP` (an internal target), `INTERNAL_SUBNET` (the internal range), `USERNAME`, `PASSWORD` and `DOMAIN`.

## Checklist

☐ Confirm privilege level, hostname and OS on the pivot host
☐ List every NIC and route with `ifconfig`, `ipconfig`, `netstat -r` or `route print`
☐ Identify networks the pivot can reach that the attack host cannot
☐ Check which outbound protocols are allowed (TCP, ICMP, DNS, HTTP/S)
☐ Choose the simplest technique the pivot's protocols support
☐ Confirm which tools are installed on the pivot and the target before transferring anything
☐ Route only the scope needed, and record every tunnel and listener for cleanup
☐ Verify each tunnel with a single known port before running wide scans

## Pages in this section

- [Pivoting overview](/methodology/pivoting/pivoting-overview/)
- [SSH local port forwarding](/methodology/pivoting/ssh-local-forwarding/)
- [SSH dynamic port forwarding (SOCKS)](/methodology/pivoting/ssh-dynamic-forwarding/)
- [SSH remote port forwarding](/methodology/pivoting/ssh-remote-forwarding/)
- [Meterpreter pivoting](/methodology/pivoting/meterpreter-pivoting/)
- [Chisel](/methodology/pivoting/chisel/)
- [ICMP tunnelling](/methodology/pivoting/icmp-tunnelling/)
- [DNS tunnelling with dnscat2](/methodology/pivoting/dns-tunnelling-dnscat2/)
- [sshuttle](/methodology/pivoting/sshuttle/)
- [Windows port forwarding with netsh](/methodology/pivoting/windows-port-forwarding-netsh/)
- [Plink](/methodology/pivoting/plink/)
- [rpivot](/methodology/pivoting/rpivot/)
- [Double pivots](/methodology/pivoting/double-pivots/)
- [SOCKS over RDP](/methodology/pivoting/socks-over-rdp/)
