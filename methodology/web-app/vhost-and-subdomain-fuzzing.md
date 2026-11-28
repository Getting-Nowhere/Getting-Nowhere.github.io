---
layout: page
title: "Vhost and Subdomain Fuzzing"
subtitle: "Finding hostnames the server answers to that no page links to"
permalink: /methodology/web-app/vhost-and-subdomain-fuzzing/
---

Subdomain and virtual host fuzzing finds additional websites that share a domain or a server with the main application. A subdomain has its own public DNS record. A virtual host (vhost) is served from the same IP address as other sites, and the web server selects the site from the HTTP `Host` header, so a vhost may have no public DNS record at all. Each hostname found is a separate application with its own routes, parameters and defects, so every hit becomes an input to content discovery and input testing.

## Subdomains and vhosts compared

| Item | How it resolves | How to find it |
|---|---|---|
| Subdomain | A public DNS record points to the server | Fuzz the label in the domain name |
| Virtual host | Same IP as other sites, chosen by the `Host` header | Fuzz the `Host` header on the known IP |

## Workflow

1. Fuzz public subdomains of the domain. Use a DNS wordlist from SecLists:

```bash
ffuf -w /opt/useful/seclists/Discovery/DNS/subdomains-top1million-5000.txt:FUZZ -u https://FUZZ.TARGET_DOMAIN/
```

2. If the domain returns no hits, check whether it has public DNS at all. A name that was added only to the local hosts file is not public. Move to vhost fuzzing.

3. Fuzz the `Host` header against the known IP address. The keyword sits in front of the parent domain:

```bash
ffuf -w /opt/useful/seclists/Discovery/DNS/subdomains-top1million-5000.txt:FUZZ -u http://TARGET_DOMAIN:TARGET_PORT/ -H 'Host: FUZZ.TARGET_DOMAIN'
```

4. Filter the default response. Many servers return the same page for any unknown `Host` value, so the first run may list every word as a hit. Measure that response size and remove it:

```bash
ffuf -w /opt/useful/seclists/Discovery/DNS/subdomains-top1million-5000.txt:FUZZ -u http://TARGET_DOMAIN:TARGET_PORT/ -H 'Host: FUZZ.TARGET_DOMAIN' -fs 900
```

Use `-fw` (words) instead when the size varies between responses but the word count does not.

5. Add each confirmed hostname to the local hosts file, mapped to TARGET_IP. Browse to it, then repeat content discovery against it as a separate target.

## What to look for

- Hits whose size or word count differs from the default response.
- Redirects to another hostname, which may reveal a further site.
- Names that suggest development, staging, administration, backup or internal systems.
- Login pages or APIs on a host that the main site never links to.

## Pitfalls

- A size filter copied from another target can hide every real hit. Measure the default response on each target.
- Fuzzing the URL path instead of the `Host` header tests a different thing. Vhosts are selected by the header.
- A 5000-entry list is a starting point. Expand it only when the scope allows the extra requests.
- A hostname found by fuzzing is not a finding until it has been checked manually.

> Record each hostname with the request that revealed it and the response size used for filtering. The filter is needed to reproduce the result.
{: .tip }
