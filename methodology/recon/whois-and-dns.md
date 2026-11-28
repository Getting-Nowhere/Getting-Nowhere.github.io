---
layout: page
title: "WHOIS and DNS Fundamentals"
subtitle: "Registration data and the DNS hierarchy that anchor all later web recon"
permalink: /methodology/recon/whois-and-dns/
---

## Purpose

WHOIS and DNS are the first sources to check. WHOIS describes who registered a domain and how it is managed. DNS describes how the domain's names map to infrastructure. Both are routine internet traffic, so querying them is low-risk and produces a foundation that every later step builds on.

## Workflow

1. Run a WHOIS lookup on the registered (root) domain.

```bash
whois DOMAIN
```

2. Record the registrar, the registrant, administrative, and technical contacts, creation and expiry dates, and the name servers.
3. Note the name servers. Their hostnames often reveal the DNS or hosting provider.
4. Resolve the apex domain and the main record types (see [DNS queries with dig](/methodology/recon/dig-dns-queries/)).
5. Save all output with the query time so changes can be compared later.

## How name resolution works

A lookup moves through a chain of caches and servers:

1. The client checks its local cache.
2. A recursive resolver checks its own cache, then starts the lookup if needed.
3. A root server points the resolver to the server for the top-level domain (for example `.com`).
4. The TLD server points to the authoritative name server for the domain.
5. The authoritative server returns the record. The resolver and client cache it for the record's TTL.

The DNS zone is the set of records the authoritative server holds for a domain. Typical record types:

| Record | Purpose | Why it matters for recon |
|---|---|---|
| A | Maps a hostname to an IPv4 address | Identifies servers and load balancers |
| AAAA | Maps a hostname to an IPv6 address | Reveals IPv6 hosts that may lack equivalent controls |
| CNAME | Aliases one hostname to another | Can point to old or third-party services |
| MX | Names the mail servers for the domain | Reveals the mail platform |
| NS | Delegates the zone to name servers | Reveals the DNS and hosting provider |
| TXT | Stores free text, such as SPF or verification tokens | Often leaks service providers and sometimes internal details |
| SOA | Holds zone administration parameters | Gives the primary name server and admin mailbox |
| SRV | Defines host and port for a service | Can reveal internal services such as SIP or directory services |
| PTR | Maps an IP address back to a name | Supports reverse lookups |

## What to look for

- **Registrant data:** names, email addresses, and phone numbers can seed OSINT and social engineering. Redaction is common, and a redacted record is still a useful data point.
- **Name server provider:** a third-party DNS host or a hosting provider narrows the infrastructure you need to examine.
- **Creation date:** older domains often carry legacy hosts and forgotten records.
- **CNAME targets:** a CNAME pointing to a deprecated or unclaimed third-party service is a candidate for a subdomain takeover.
- **TXT records:** verification tokens and SPF policies identify SaaS providers (covered in [infrastructure enumeration](/methodology/recon/infrastructure-enumeration/)).

> WHOIS data is frequently redacted by privacy services or by registry policy. An empty registrant field usually means redaction, not a tool failure.
{: .info }

## Pitfalls

- Registrant or technical contacts may belong to a reseller or hosting company rather than the target organisation. Verify before pivoting.
- Cached answers reflect the record TTL. A recent DNS change may not be visible yet, so query the authoritative server directly when precision matters.
- A WHOIS record shows registration, not current ownership or hosting. Confirm with DNS and live probing.

## Defense and prevention

- Use registration privacy services and keep contact details accurate and role-based where possible.
- Keep the DNS zone limited to records that are needed. Remove stale A, CNAME, and TXT records when services are retired.
- Do not publish internal naming schemes or internal IP addresses in public DNS.
