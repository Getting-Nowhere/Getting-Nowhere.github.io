---
layout: page
title: "DNS Zone Transfers"
subtitle: "Testing AXFR on each authoritative name server for a complete zone copy"
permalink: /methodology/recon/zone-transfers/
---

## Purpose

A DNS zone transfer (AXFR) copies every record in a zone from one name server to another. It exists to keep primary and secondary servers in sync. If a server allows transfers to anyone, an attacker receives the full list of hostnames, IP addresses, and name servers in one response. Testing for this is a fast, high-value check.

## How a transfer works

1. The secondary server requests a transfer from the primary server.
2. The primary server replies with its SOA record, which includes the serial number.
3. The primary server sends each record in the zone.
4. The primary server signals that the transfer is complete.
5. The secondary server acknowledges the transfer.

Zone transfers use TCP port 53.

## Workflow

1. List the authoritative name servers for the domain.

```bash
dig NS DOMAIN +short
```

2. Attempt a transfer against each name server. Test every one, because a misconfiguration may exist on only one.

```bash
dig axfr DOMAIN @NS_HOSTNAME
```

3. Interpret the result:
   - **Refused or empty:** the server rejects the transfer. Move on to the next name server.
   - **Records returned:** save the complete output and parse it for subdomains, IP addresses, and name server records.

4. Parse the output into a unique hostname list.

```bash
dig axfr DOMAIN @NS_HOSTNAME | awk '{print $1}' | sed 's/\.$//' | grep DOMAIN | sort -u
```

5. Feed the hostnames into resolution, vhost testing, and port scanning.

## What a successful transfer leaks

| Data | Why it matters |
|---|---|
| Subdomains | Includes hidden development, admin, and internal hostnames not linked from the main site |
| IP addresses | Gives direct targets for scanning and service enumeration |
| Name server records | Reveals the hosting provider and possible misconfigurations |

> A successful transfer is a finding in itself. Document the name server, the transfer command, and the number of records returned, and report it with a clear remediation.
{: .warning }

## Pitfalls

- A refused transfer does not mean the zone is secure. Brute force and passive sources can still expose the same names.
- Some name servers allow transfers only from specific source addresses. A refusal from your location may not apply to all clients.
- Zone transfer testing is a DNS query against the target's infrastructure, so confirm it is in scope before running it.

## Defense and prevention

- Restrict AXFR to authorised secondary servers by IP address, and where possible use TSIG keys to authenticate transfers.
- Deny transfers to any other client, including on TCP port 53.
- Audit every authoritative name server, not only the primary.
- Keep the zone free of host records that should not be public.
