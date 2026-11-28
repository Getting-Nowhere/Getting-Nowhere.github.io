---
layout: page
title: "Subdomain Enumeration"
subtitle: "Finding development, legacy, and hidden hostnames under the target domain"
permalink: /methodology/recon/subdomain-enumeration/
---

## Purpose

Subdomains often host development, staging, legacy, administrative, or partner systems. These tend to receive less scrutiny than the main site, so they are high-value targets. Subdomain enumeration produces a candidate list that feeds vhost testing, crawling, and port scanning.

## Why subdomains matter

- **Development and staging environments** may expose unreleased features or weaker configurations.
- **Hidden login portals** such as admin or VPN front ends may not be linked from the main site.
- **Legacy applications** may run outdated software on older subdomains.

## Method overview

Subdomains are discovered through two approaches:

| Approach | Technique | Notes |
|---|---|---|
| Passive | Certificate transparency logs, search engines, public datasets | No direct queries to the target's name servers |
| Active | Zone transfer attempts, DNS brute force | Sends queries to the target's infrastructure |

## Workflow

1. Enumerate passively first (see [Certificate transparency](/methodology/recon/certificate-transparency/)) and collect a seed list.
2. Attempt a zone transfer against each authoritative name server (see [DNS zone transfers](/methodology/recon/zone-transfers/)).
3. Choose a wordlist. Use a targeted list based on the organisation's industry, technologies, and naming patterns to reduce false positives. Build a custom list from keywords seen during passive recon.
4. Run a brute-force enumeration, for example with `dnsenum`, which can also recurse into discovered subdomains.

```bash
dnsenum --enum DOMAIN -f WORDLIST_PATH -r
```

The `-r` flag enables recursive brute forcing: when a subdomain is found, the tool looks for subdomains of that subdomain.

5. Resolve each candidate and keep only names that return an address.

```bash
for s in $(cat SUBDOMAIN_CANDIDATES); do host "$s" | grep "has address"; done
```

6. Check for wildcard DNS. If every random label resolves, brute-force output will be inflated. Some tools, such as `fierce`, include wildcard detection.
7. Deduplicate and record the results with their IP addresses.

## Tools

| Tool | Description |
|---|---|
| dnsenum | Dictionary and brute-force enumeration, with recursion and zone transfer attempts |
| fierce | Recursive discovery with wildcard detection and a simple interface |
| dnsrecon | Combines several DNS reconnaissance techniques with multiple output formats |
| amass | Actively maintained discovery tool with many data sources |
| assetfinder | Lightweight discovery for quick scans |
| puredns | DNS brute forcing with resolution and filtering |

## What to look for

- Names that suggest development, staging, admin, VPN, or internal services.
- Subdomains that resolve to IP addresses outside the main hosting range. These may belong to a third party or a forgotten system.
- CNAME records that point to services no longer in use (potential takeover).
- Different responses from the same IP for different subdomains, which hints at virtual hosting (see [Virtual host discovery](/methodology/recon/vhost-discovery/)).

> Record the enumeration source for each subdomain. A name found only in certificate logs may no longer resolve, and that difference matters when you report it.
{: .tip }

## Pitfalls

- Brute forcing with a generic large wordlist creates a lot of noise and traffic. Start small and expand only as needed.
- Wildcard records can make every name appear valid. Test with a random label first.
- Some tools need the resolver set explicitly, otherwise results depend on the local cache.

## Defense and prevention

- Do not place development or staging systems on public DNS unless they are protected.
- Require authentication for administrative and internal portals regardless of how hidden they are.
- Monitor certificate issuance for unexpected hostnames and retire subdomains that are no longer needed.
