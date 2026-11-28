---
layout: page
title: "DNS"
subtitle: "Name server discovery, zone transfers and subdomain enumeration on port 53"
permalink: /methodology/service-enumeration/dns/
---

## Purpose

DNS maps names to addresses and is one of the first services to examine on any external target. A name server can disclose its software version, the hosts it knows about and, if misconfigured, the full contents of a zone. This page covers how to identify the name servers for a domain, query them for useful records and check whether they expose data they should not.

## Background

DNS is hierarchical. Root servers direct queries to top-level domain servers, which delegate to the authoritative name servers for each zone. Caching, forwarding and resolver components sit between clients and that hierarchy. The record types most useful during enumeration are:

| Record | Enumeration value |
| --- | --- |
| A, AAAA | IPv4 and IPv6 addresses behind a name |
| MX | Mail servers, which often reveal the mail platform and related hosts |
| NS | Authoritative name servers, the next targets for queries |
| TXT | Verification tokens and SPF or DMARC policies, which can name third-party services or internal ranges |
| CNAME | Aliases that expose internal naming or third-party hosting |
| PTR | Reverse lookups that map addresses back to names |
| SOA | The primary server and the administrative mailbox for the zone |

## Enumeration steps

### 1. Identify the authoritative name servers

```bash
dig NS DOMAIN @TARGET_IP
```

Repeat the query against each name server returned so that the answers can be compared. Inconsistent answers between servers are a finding in their own right.

### 2. Check version information

```bash
dig CH TXT version.bind @TARGET_IP
```

If the server publishes this Chaos-class entry, the answer contains its software version. Many operators hide or alter it, so an empty answer is no information rather than a negative result.

### 3. Query for all available records

```bash
dig ANY DOMAIN @TARGET_IP
```

Some servers return a minimal response to ANY queries. If so, request the individual record types (A, MX, NS, TXT, SOA) one at a time.

### 4. Attempt a zone transfer

```bash
dig axfr DOMAIN @TARGET_IP
dig axfr internal.DOMAIN @TARGET_IP
```

Zone transfers run over TCP port 53. The second query tests for an internally named zone that may also be exposed. A successful transfer returns every record in the zone, which is usually the highest-value DNS result.

### 5. Brute-force subdomains

```bash
for sub in $(cat WORDLIST); do dig $sub.DOMAIN @TARGET_IP | grep -v ';\|SOA' | sed -r '/^\s*$/d' | grep $sub | tee -a subdomains.txt; done
```

An equivalent run with dnsenum:

```bash
dnsenum --dnsserver TARGET_IP --enum -f WORDLIST DOMAIN
```

### 6. Review configuration (with host access)

```bash
cat /etc/bind/named.conf.local
cat /etc/bind/named.conf.options
ls /etc/bind/
```

Zone files should contain an SOA and NS record at the zone apex. Reverse zone files are needed for fully qualified names to resolve in both directions.

## What to look for

| Option | Risk when permissive |
| --- | --- |
| `allow-transfer` | Any requester can download the full zone |
| `allow-recursion` | The server acts as an open resolver, usable for reconnaissance or amplification |
| `allow-query` | Internal zone data is answered for untrusted clients |
| `zone-statistics` | Collects zone statistics that can aid reconnaissance |

- Name servers outside the expected infrastructure, or servers in a different organisation.
- Internal hostnames, development or staging names, VPN and admin hosts in public zones.
- Mail servers and TXT records that name third-party services or internal address ranges.

> A successful zone transfer changes the engagement. Record the full output and confirm that the data came from an in-scope server before using it.
{: .tip }

## Pitfalls

- **Wildcard records** make every subdomain resolve, so brute-force output is meaningless. Query a random, non-existent label first to detect a wildcard.
- **Blocked TCP 53** prevents zone transfers even when UDP queries succeed. Test both transports.
- **Encrypted transports** such as DNS over TLS (DoT) and DNS over HTTPS (DoH) hide queries from network observers. They do not change what the server returns.
- **Brute-force volume** can be large. Agree on a rate limit with the client and use a focused wordlist first.
- **Stale records** can point to hosts that no longer exist. Confirm that a name resolves to a live service before reporting it.

## Defense and prevention

Restrict `allow-transfer` to named secondary servers and authenticate transfers with TSIG keys. Limit `allow-recursion` to internal clients, and avoid publishing version details. Separate internal and external views so that internal names never appear in public zones, and remove records for decommissioned hosts.
