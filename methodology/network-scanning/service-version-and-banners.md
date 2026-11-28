---
layout: page
title: "Service Version Detection and Banner Grabbing"
subtitle: "Identifying services and versions with Nmap, then verifying the banner manually"
permalink: /methodology/network-scanning/service-version-and-banners/
---

## Purpose

Knowing that a port is open is only the start. Version detection identifies the service behind each port and its version, which is required for matching against known vulnerabilities. Banner grabbing is the act of reading the greeting or response a service sends on connection. Nmap performs both automatically, and you can verify the result by hand.

## How version detection works

Nmap connects to each open port and reads the banner that the service sends. If the service does not announce itself, Nmap sends a series of probes and matches the responses against a signature database. The result is a service name, product, and version where available.

## Workflow

1. Run version detection on all ports of a host. `--stats-every` prints progress at a set interval, and `-vv` prints open ports as they are found.

```bash
sudo nmap TARGET_IP -p- -sV -Pn -n --disable-arp-ping --stats-every=5s -vv
```

2. Run version detection on the ports already known to be open, to save time.

```bash
sudo nmap TARGET_IP -p 80,443,3306 -sV
```

3. Trace the connection to see the banner. The trace shows the banner text in the service reply.

```bash
sudo nmap TARGET_IP -p- -sV -Pn -n --disable-arp-ping --packet-trace
```

4. Confirm the banner by connecting manually with netcat. This is useful for services where the banner matters and for checking whether Nmap's identification is correct.

```bash
nc -nv TARGET_IP PORT
```

5. Capture the handshake and banner exchange with tcpdump on the interface that carries the traffic. Use this to prove the banner in a report or to debug connectivity.

```bash
sudo tcpdump -i INTERFACE host ATTACKER_IP and TARGET_IP
```

## Reading the handshake

A TCP connection and banner exchange follow a predictable sequence:

| Step | Direction | Flags | Meaning |
|---|---|---|---|
| 1 | Client to server | SYN | Connection request |
| 2 | Server to client | SYN-ACK | Server accepts |
| 3 | Client to server | ACK | Handshake complete |
| 4 | Server to client | PSH-ACK | Server sends the banner |
| 5 | Client to server | ACK | Client acknowledges the banner |

A mail server, for example, sends a `220` greeting with its product name when the connection opens.

## What to look for

- Version strings for software with known vulnerabilities. Confirm the version before reporting.
- Services running on unexpected ports, such as a web server on a database port.
- Banners that differ from the service Nmap reports, which can indicate a custom service or a proxy.
- Services that send no banner, which typically need a protocol-specific probe.

> Version detection gives a candidate version, not a confirmed vulnerability. Verify the version through the service's own response or documentation before drawing a conclusion.
{: .tip }

## Pitfalls

- Full-port version detection is slow. Scan all ports only when the host is in scope and time allows.
- Banners can be suppressed or altered, so an unknown or generic result is not proof that the service is absent.
- Version detection sends probes that some services log. Keep the scan within the agreed rules.

## Defense and prevention

- Suppress or genericise banners where the product allows, without relying on this as a security control.
- Keep services patched so that the reported version matches a supported release.
- Use protocol-level access controls so that only expected clients can reach a service.
