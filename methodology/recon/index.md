---
layout: page
title: "Recon"
subtitle: "Phase checklist and index for web and infrastructure reconnaissance"
permalink: /methodology/recon/
---

Reconnaissance builds a map of what the target exposes before any exploitation begins. The goals are to identify assets (pages, subdomains, IP addresses, technologies), to surface information that was never meant to be public, to understand the attack surface, and to gather intelligence on people and processes that could be leveraged later. Start with passive, low-noise techniques, record the source and confidence of every finding, and move to active techniques only within the agreed scope.

| Approach | Techniques | Detection risk |
|---|---|---|
| Passive | Search engine queries, WHOIS, DNS records, certificate transparency logs, web archives, social media, public code repositories | Very low; the target typically does not see the traffic |
| Active | Port scanning, vulnerability scanning, banner grabbing, service enumeration, web spidering, brute-forcing names | Higher; generates traffic that logs and alerts can capture |

## Phase checklist

- ☐ Confirm scope and rules of engagement (in-scope domains, IP ranges, forbidden actions)
- ☐ WHOIS: registrar, registrant, name servers, and key dates
- ☐ DNS records: A, AAAA, MX, NS, TXT, CNAME, and SOA
- ☐ Attempt zone transfers against every authoritative name server
- ☐ Enumerate subdomains passively (certificate transparency, search) and actively (brute force)
- ☐ Identify virtual hosts sharing an IP address
- ☐ Run Google dork queries for login pages, exposed files, configuration files, and backups
- ☐ Crawl the site; review robots.txt, sitemaps, comments, and JavaScript files
- ☐ Check `.well-known` endpoints for security and identity metadata
- ☐ Fingerprint the web server, frameworks, and any WAF
- ☐ Map infrastructure: IP ownership, hosting providers, and third-party services
- ☐ Check for exposed cloud storage
- ☐ Profile staff and technology stack from public sources
- ☐ Record each finding with its source, timestamp, and confidence level

## Pages in this section

- [WHOIS and DNS fundamentals](/methodology/recon/whois-and-dns/)
- [DNS queries with dig](/methodology/recon/dig-dns-queries/)
- [Subdomain enumeration](/methodology/recon/subdomain-enumeration/)
- [DNS zone transfers](/methodology/recon/zone-transfers/)
- [Certificate transparency](/methodology/recon/certificate-transparency/)
- [Virtual host discovery](/methodology/recon/vhost-discovery/)
- [Google dorking](/methodology/recon/google-dorking/)
- [Crawling](/methodology/recon/crawling/)
- [The .well-known directory](/methodology/recon/well-known-uris/)
- [Web fingerprinting](/methodology/recon/fingerprinting/)
- [Infrastructure enumeration](/methodology/recon/infrastructure-enumeration/)
- [Cloud storage enumeration](/methodology/recon/cloud-storage-enumeration/)
- [Staff and technology OSINT](/methodology/recon/staff-osint/)

Network-level discovery and port scanning are covered in the [network scanning section](/methodology/network-scanning/).
