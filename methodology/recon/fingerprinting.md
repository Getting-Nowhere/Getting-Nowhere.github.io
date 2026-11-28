---
layout: page
title: "Web Fingerprinting"
subtitle: "Identifying web server, frameworks, versions, and WAFs from responses"
permalink: /methodology/recon/fingerprinting/
---

## Purpose

Fingerprinting determines what software a target runs and which versions it uses. Knowing the server, framework, and content management system lets you focus on relevant known weaknesses, spot outdated components, and prioritise targets. It also builds a profile that combines with other recon results.

## Techniques

| Technique | What it reveals | Noise level |
|---|---|---|
| Banner grabbing | Server software and version from response headers | Low |
| HTTP headers | `Server` and `X-Powered-By` often name the server or language | Low |
| Page content | Generator meta tags, script paths, and asset naming | Low |
| Probing | Crafted requests that trigger version-specific behaviour | Higher |

## Workflow

1. Grab the headers of the root page. Use `-I` (`--head`) to request headers only.

```bash
curl -I http://DOMAIN
```

2. Follow redirects to the final destination. Each hop may send different headers, and the final response is usually the most informative. Adding `-L` follows redirects, and the `-s` flag suppresses progress output.

```bash
curl -sIL https://DOMAIN
```

3. Check the headers that matter most:
   - `Server`: web server and version
   - `X-Powered-By`: language or framework
   - `Link`: API discovery links, such as a REST endpoint
   - Custom headers such as `X-Redirect-By`: may name the platform

4. Identify a web application firewall, if present.

```bash
wafw00f https://DOMAIN
```

5. Run a software identification scan. Restricting Nikto to its software identification tests keeps it focused on fingerprinting.

```bash
nikto -h DOMAIN -Tuning b
```

6. Cross-check results with a browser-based profiler such as Wappalyzer, BuiltWith, or WhatWeb.

## Tools

| Tool | Description |
|---|---|
| Wappalyzer | Browser extension and online service for technology profiling |
| BuiltWith | Technology profiler with free and paid detail levels |
| WhatWeb | Command-line fingerprinting with a large signature database |
| Nmap | Service and OS fingerprinting, with NSE scripts for specialised checks |
| Netcraft | Hosting, technology, and security reporting |
| wafw00f | Detects and identifies web application firewalls |

## Example findings

A redirect chain such as HTTP to HTTPS to `www` is normal, but the headers on the final response are where the detail is. In an example, the final response disclosed an Apache version, a WordPress-specific header, and a `Link` header pointing to the WordPress REST API. That combination points to a WordPress site and a list of CMS-specific paths to check.

## What to look for

- Versions that are end-of-life or several releases behind the current release.
- CMS login pages and readme or license files that confirm the platform.
- Mismatches between headers and content, which can indicate a reverse proxy or a WAF.
- Missing security headers such as `Strict-Transport-Security` or `X-Content-Type-Options`, which are configuration weaknesses to report.

> Nikto generates many requests per scan. Use it only when active scanning is in scope, and prefer header-based checks when stealth matters.
{: .warning }

## Pitfalls

- Headers can be removed or altered. A missing `Server` header is not proof of a different stack.
- Version numbers in banners may be backported patches. Confirm before assuming a vulnerability.
- A WAF can return generic responses that look like a fingerprint. Identify the WAF first, then interpret the results.

## Defense and prevention

- Remove or genericise `Server` and `X-Powered-By` headers where the product allows.
- Keep web servers, frameworks, and CMS components patched and remove readme or license files that identify the software.
- Apply security headers consistently, including HSTS and `X-Content-Type-Options`.
