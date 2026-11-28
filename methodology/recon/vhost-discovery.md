---
layout: page
title: "Virtual Host Discovery"
subtitle: "Finding sites hosted behind a shared IP address by fuzzing the Host header"
permalink: /methodology/recon/vhost-discovery/
---

## Purpose

Virtual hosting lets one server answer for many websites. The web server uses the HTTP `Host` header to decide which site to serve. A hostname may be missing from DNS, may not be published, or may point to the same IP as the main site. Virtual host (vhost) discovery finds these hidden sites by sending requests with different `Host` values and comparing the responses.

## How name-based virtual hosting works

1. The browser requests a site and includes the domain in the `Host` header.
2. The web server reads the header and selects the matching virtual host.
3. The server returns that site's files and resources.

Apache, for example, uses one block per site:

```text
<VirtualHost *:80>
    ServerName www.example1.com
    DocumentRoot /var/www/example1
</VirtualHost>
```

## Virtual hosting types

| Type | How sites are separated | Notes |
|---|---|---|
| Name-based | HTTP `Host` header | Most common and flexible; limited with SSL/TLS in some setups |
| IP-based | A unique IP per site | Does not depend on the `Host` header; works with any protocol |
| Port-based | Different ports per site | Useful when IP addresses are scarce |

Name-based hosting is the type that vhost fuzzing targets.

## Workflow

1. Confirm the default response. Request the server by IP and note the status code, size, and content.

```bash
curl -s -o /dev/null -w "%{http_code} %{size_download}\n" http://TARGET_IP/
```

2. Build a wordlist. Start with common hostnames and add names derived from subdomain and certificate results.

3. Fuzz the `Host` header with gobuster. The `--append-domain` flag appends the base domain to each word, so the full virtual hostname is built correctly.

```bash
gobuster vhost -u http://TARGET_IP -w WORDLIST --append-domain
```

Useful options include `-t` to raise the thread count and `-k` to ignore TLS certificate errors on HTTPS targets.

4. Alternatively, fuzz with ffuf and filter out responses that match the default. Filtering by size is common when the default page is a fixed length.

```bash
ffuf -w WORDLIST:FUZZ -u http://TARGET_IP/ -H "Host: FUZZ.DOMAIN" -fs DEFAULT_SIZE
```

5. Review hits manually. Add confirmed hostnames to the local hosts file mapping them to TARGET_IP so that the browser and tools send the correct `Host` header.

## Tools

| Tool | Notes |
|---|---|
| gobuster | Multi-purpose; supports vhost mode, custom wordlists, and threading |
| feroxbuster | Rust-based; supports recursion, wildcard handling, and filters |
| ffuf | Fast fuzzer; fuzzes the `Host` header with flexible response filtering |

## What to look for

- A response that differs from the default in status code, size, word count, or title.
- Hostnames that resolve to the same IP but serve a different application, such as a staging site or an admin panel.
- Redirects to unexpected domains.

> Pick a filter, such as response size, that excludes the default response. Test it against a random hostname first. If a random name returns a different response, you have a wildcard virtual host and the filter needs adjusting.
{: .tip }

## Pitfalls

- Wildcard virtual hosts return the same default page for any name, which floods the output.
- Without the correct domain suffix, results will be meaningless. Check the `--append-domain` or `Host` header format before running.
- Vhosts can be restricted to specific clients or hidden behind TLS SNI. A missing result is not proof that a vhost does not exist.

## Defense and prevention

- Configure a default virtual host that refuses unknown `Host` headers, for example by returning an error or closing the connection.
- Do not expose development or staging vhosts on production IP addresses.
- Require authentication for administrative vhosts, and monitor for high volumes of requests with varying `Host` headers.
