---
layout: page
title: "Infrastructure Enumeration"
subtitle: "Mapping IP addresses, hosting, mail, and third-party services from DNS and external data"
permalink: /methodology/recon/infrastructure-enumeration/
---

## Purpose

Infrastructure enumeration answers three questions: which IP addresses belong to the target, which of those are hosted by the company itself, and which third-party services the organisation depends on. The answers identify systems you can probe directly and show where trust relationships and shared credentials might exist.

## Workflow

1. Resolve the list of subdomains to IP addresses and keep only the addresses that belong to the target.

```bash
for i in $(cat SUBDOMAIN_LIST); do host "$i" | grep "has address" | grep DOMAIN | cut -d" " -f1,4; done
```

2. Separate company-operated hosts from those hosted by third parties. Cloud providers and CDNs often appear as the resolved address, and their hostnames show the provider (for example, a cloud storage website endpoint).

3. Save the unique IP addresses to a file for internet-wide search.

```bash
for i in $(cat SUBDOMAIN_LIST); do host "$i" | grep "has address" | grep DOMAIN | cut -d" " -f4 >> ip-addresses.txt; done
```

4. Query an internet-wide search service, such as Shodan, for each address. These services index open ports, banners, and service versions.

```bash
for i in $(cat ip-addresses.txt); do shodan host "$i"; done
```

5. Pull the full DNS record set. Querying `ANY` may return a limited result set on some servers, so also query the important types individually.

```bash
dig any DOMAIN
dig DOMAIN TXT +short
```

## Reading the DNS records

| Record | What it tells you |
|---|---|
| A | Which IP addresses serve the apex and subdomains |
| MX | Which mail provider handles email |
| NS | Which DNS provider hosts the zone |
| TXT | Verification tokens and SPF policy, which name third-party services |
| SOA | Administrative contact and zone parameters |

### Interpreting TXT records

TXT records often expose the service stack. Verification strings show which platforms the organisation has registered with. SPF records list the mail senders the domain authorises, and they can include IP addresses or ranges.

Typical findings:

- Collaboration and development platform verification (for example, an Atlassian token), which suggests the company uses that tool.
- Mail platform verification and mail provider includes, which show the email stack.
- Remote access tool verification, which indicates remote management software is in use. Remote access tools are high value because password reuse on them can grant access to many systems.
- Email API provider includes, which suggest API endpoints that deserve testing for injection, authorisation, and request-forgery issues.
- Explicit `ip4:` entries in SPF, which can reveal mail gateways or other infrastructure.
- Domain registrar verification, which confirms where domains are managed.

> Record each third-party service as an entry in the attack surface inventory. Verify each one belongs to the target before testing, because shared SaaS platforms host many organisations.
{: .info }

## What to look for

- IP addresses outside the company's known ranges that still serve the target's content.
- Hosts that appear in Shodan with unexpected open services such as FTP, SSH, SNMP, or Telnet.
- Remote access, VPN, or administrative services exposed directly on the internet.
- SPF entries with internal address space, which hint at network layout.

## Pitfalls

- Shared hosting and CDN addresses are not the target's own infrastructure. Attributing them to the target without verification risks testing out of scope.
- Search service data is a snapshot and can be stale. Confirm each port is open before reporting it.
- DNS results can change between queries. Record the query date with each result.

## Defense and prevention

- Keep TXT records minimal and remove verification tokens for services no longer in use.
- Restrict SPF to the sending sources the organisation actually uses and avoid unnecessary `ip4:` entries.
- Do not expose remote access services directly to the internet. Place them behind a VPN or access gateway with multi-factor authentication.
- Use unique credentials for remote access tools and administrative accounts, and audit reuse.
