---
layout: page
title: "Google Dorking"
subtitle: "Using search operators to surface exposed pages, files, and configuration"
permalink: /methodology/recon/google-dorking/
---

## Purpose

Search engines index far more of the web than most administrators realise. Advanced operators ("dorks") narrow results to a single domain, file type, or keyword pattern, which can reveal login pages, documents, configuration files, and backups that were published by mistake. Dorking is passive: the queries go to the search engine, not to the target.

## Core operators

| Operator | Purpose | Example |
|---|---|---|
| `site:` | Restricts results to a domain | `site:DOMAIN` |
| `inurl:` | Term appears in the URL | `inurl:login` |
| `intitle:` | Term appears in the page title | `intitle:"index of"` |
| `intext:` / `inbody:` | Term appears in the body text | `intext:"password reset"` |
| `filetype:` | Specific file type | `filetype:pdf` |
| `ext:` | File extension (synonym-style match) | `ext:conf` |
| `allinurl:` / `allintitle:` | All listed words must appear | `allintitle:confidential report` |
| `AND`, `OR`, `NOT` or `-` | Boolean logic | `site:DOMAIN -inurl:blog` |
| `" "` | Exact phrase | `"information security policy"` |
| `*` | Wildcard word | `user* manual` |
| `..` | Numeric range | `price 100..500` |

Some operators, such as `cache:`, `link:`, and `related:`, have been limited or removed by search providers over time. Verify that an operator returns results before relying on it.

## Workflow

1. Confirm the domain in scope and set `site:DOMAIN` as the base of every query.
2. Start broad with file types and then narrow by keyword.

```text
site:DOMAIN filetype:pdf
site:DOMAIN (filetype:xls OR filetype:docx)
```

3. Search for login and administrative interfaces.

```text
site:DOMAIN (inurl:login OR inurl:admin)
```

4. Search for configuration files and their extensions.

```text
site:DOMAIN inurl:config.php
site:DOMAIN (ext:conf OR ext:cnf)
```

5. Search for backups and database dumps.

```text
site:DOMAIN inurl:backup
site:DOMAIN filetype:sql
```

6. Record every hit with its URL, the query that found it, and the date. Open each result only if it is in scope and only to confirm what it is.

## What to look for

- Login portals, admin consoles, and API documentation that were not linked from the site.
- Documents containing internal names, staff details, network diagrams, or policies.
- Configuration and environment files that expose hostnames, paths, or credentials.
- Backups and dumps, which often contain full application data.
- Directory listings, which show the contents of a folder.

> Treat a search hit as a lead, not a finding. Confirm that the resource is live and publicly reachable, and avoid interacting with sensitive data beyond what is needed to prove exposure.
{: .warning }

## Pitfalls

- Search results come from the search engine's index, which may be stale. A page can be indexed long after it was removed.
- Rate limits and CAPTCHAs will interrupt automated querying. Space queries out and keep the query list short.
- Operator behaviour changes over time, so the same query may return different results on different days.

## Defense and prevention

- Keep backups, dumps, and configuration files outside the web root.
- Disable directory listings.
- Use `noindex` or access controls for pages that should not appear in search results, and remember that `noindex` does not protect content from direct access.
- Periodically run the same dork queries against your own domains and remove anything that should not be public.
