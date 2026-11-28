---
layout: page
title: "DNS Queries with dig"
subtitle: "Querying record types, choosing resolvers, and reading dig output"
permalink: /methodology/recon/dig-dns-queries/
---

## Purpose

`dig` is the standard tool for manual DNS queries. It supports every record type, lets you choose the resolver, and produces detailed output for analysis. Use it to confirm records before automated tools run and to inspect individual records during an assessment.

## Workflow

1. Start with the default A record lookup, then query each record type that matters.

```bash
dig DOMAIN
dig DOMAIN A
dig DOMAIN AAAA
dig DOMAIN MX
dig DOMAIN NS
dig DOMAIN TXT
dig DOMAIN CNAME
dig DOMAIN SOA
```

2. Query a specific resolver when the default one returns cached or inconsistent answers.

```bash
dig @RESOLVER_IP DOMAIN
```

3. Trace the full resolution path to see which servers answer at each step.

```bash
dig +trace DOMAIN
```

4. Reverse-look up an IP address to find the host name it is registered under. Specify a name server if the default gives no answer.

```bash
dig -x TARGET_IP
dig -x TARGET_IP @RESOLVER_IP
```

5. Use compact output when scripting.

```bash
dig +short DOMAIN
dig +noall +answer DOMAIN
```

6. Request all records. Many servers ignore `ANY` queries under RFC 8482, so an empty result does not mean the zone is empty.

```bash
dig DOMAIN ANY
```

## Reading the output

A typical response has four parts:

- **Header:** the `opcode`, `status` (for example `NOERROR`), and `id`. The flags show `qr` (this is a response), `rd` (recursion was requested), and `ad` (the resolver considers the data authentic). A "recursion requested but not available" warning means the server will not resolve recursively, which is common for authoritative servers.
- **Question section:** the name and record type asked for.
- **Answer section:** the records returned, with TTL, class, type, and value.
- **Footer:** query time, the server that answered and protocol used, the timestamp, and the message size.

An OPT pseudosection appears when EDNS is in use. EDNS extends DNS for larger messages and DNSSEC.

## Comparing DNS lookup tools

| Tool | Strength | Typical use |
|---|---|---|
| `dig` | Full record types, resolver selection, detailed output | Manual analysis, zone transfer attempts, troubleshooting |
| `nslookup` | Simple, common on Windows | Quick A, AAAA, and MX checks |
| `host` | Concise output | Fast checks inside shell loops |

## What to look for

- Multiple A records may indicate a load balancer or several front-end servers.
- MX records show the mail provider, which points to the email platform in use.
- NS records show whether DNS is hosted by a third party. Note each name server for later zone transfer testing.
- TXT records can contain verification tokens and SPF policy text. These are covered in [infrastructure enumeration](/methodology/recon/infrastructure-enumeration/).
- Answers that differ between resolvers may indicate split-horizon DNS.

> Querying an authoritative name server directly is more reliable than querying a public resolver, because public resolvers may return cached data.
{: .tip }

## Pitfalls

- Public resolvers such as `1.1.1.1` or `8.8.8.8` may return stale answers. Compare results from the authoritative servers.
- `dig -x` gives the PTR name only if a reverse zone exists. A missing answer is not evidence that the host has no name.
- Do not assume `ANY` returns everything. Query the specific record types you need.

## Defense and prevention

- Restrict `ANY` responses or minimise the information they return.
- Keep TXT records to the minimum required for verification and policy.
- Use split-horizon DNS if internal names must differ from public ones, and make sure the internal view is not reachable from outside.
