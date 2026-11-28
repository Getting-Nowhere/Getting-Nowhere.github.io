---
layout: page
title: "DNS Attacks"
subtitle: "Zone transfers, subdomain enumeration, takeovers and DNS spoofing"
permalink: /methodology/services-attacks/dns-attacks/
---

The Domain Name System translates names into IP addresses. It mostly uses UDP port 53 for queries, while TCP port 53 handles zone transfers and larger responses. DNS is valuable in an assessment because it reveals hosts, subdomains and infrastructure, and misconfigurations in zone transfers or dangling records can expose or hand over parts of the namespace.

## Workflow

1. Identify the authoritative name servers for the target domain.
2. Attempt a zone transfer from each name server.
3. Enumerate subdomains passively and by brute force.
4. Check subdomain CNAME records for dangling targets (takeover candidates).
5. Assess whether DNS traffic on the local network can be poisoned or spoofed.

## Enumeration

```bash
nmap -sV -sC -p53 TARGET_IP
dig NS DOMAIN
```

Nmap's default scripts and service detection identify the DNS software. The `NS` query lists the authoritative servers that need to be tested individually.

## Zone transfer

```bash
dig AXFR @ns1.DOMAIN DOMAIN
fierce --domain DOMAIN
```

`AXFR` requests a complete copy of a zone. A server that answers it to any client leaks every record in the zone. `fierce` automates the lookup of name servers for the root domain and tests each one for zone transfer.

## Subdomain enumeration

```bash
./subfinder -d DOMAIN -v
```

Subfinder queries passive sources. Sublister covers similar ground, and `subbrute` performs pure DNS brute forcing with a chosen list of resolvers. Combine passive and active results and remove duplicates before testing.

## Subdomain takeover

A subdomain takeover occurs when a record points at a resource that no longer exists or is unclaimed.

```text
sub.DOMAIN.      60   IN   CNAME   EXPIRED_TARGET.example.
```

If the target domain behind the CNAME expires or the cloud resource it names is deleted, anyone who registers that name controls content served under the victim's subdomain.

> Check each CNAME target for an unclaimed status message from the hosting provider before reporting a takeover. Do not claim the name on a live engagement without written authorization.
{: .warning }

## DNS spoofing

DNS spoofing, also called DNS cache poisoning, replaces legitimate DNS answers with false ones so that users reach an attacker-controlled host. On a local network, a man-in-the-middle position is needed to intercept the victim's queries.

```text
DOMAIN        A   ATTACKER_IP
*.DOMAIN      A   ATTACKER_IP
```

Ettercap's DNS spoofing plugin reads a hosts-style mapping file like this and answers matching queries with the attacker address. Bettercap can perform the same local poisoning. Use this only where the scope explicitly allows it, since it affects every client on the network.

## What to look for

- Zone transfer accepted from an address that is not a secondary server.
- Internal hostnames, development and admin subdomains in the zone.
- CNAME records pointing at third-party services that are unclaimed.
- Name servers that answer queries from any network.

## Pitfalls

- A zone transfer may be refused by the first name server and allowed by another; test them all.
- Brute-force results include wildcard records. Detect wildcards before counting hits.
- Spoofing affects real users and can disrupt services. Limit the scope and timing.

## Defense and prevention

Restrict zone transfers to known secondary servers with a transfer ACL, remove dangling CNAME records when a service is retired, deploy DNSSEC where the zone supports it, and monitor for unexpected changes. See the [services prevention](/methodology/services-attacks/prevention/) page.
