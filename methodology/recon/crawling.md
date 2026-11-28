---
layout: page
title: "Web Crawling"
subtitle: "Systematically mapping links, files, comments, and metadata across a site"
permalink: /methodology/recon/crawling/
---

## Purpose

Crawling (spidering) automates the browsing of a website. A crawler starts from a seed URL, extracts links, queues them, and repeats until the scope or a limit is reached. The result is a map of pages, scripts, documents, and comments that manual browsing would take far longer to produce.

## How a crawler works

1. Fetch the seed URL and parse the HTML.
2. Extract all links, forms, and resource references.
3. Add in-scope links to a queue, skipping those already visited.
4. Repeat until the queue is empty or a depth, page, or time limit is reached.

Two traversal orders are common:

| Order | Behaviour | When it helps |
|---|---|---|
| Breadth-first | Visits every link at one depth before going deeper | Gives a broad picture of the site's top-level structure |
| Depth-first | Follows one branch to its end before backtracking | Reaches deeply nested content quickly |

## Tools

| Tool | Notes |
|---|---|
| Burp Suite Spider | Integrated with the proxy; useful when crawling alongside manual testing |
| OWASP ZAP | Open-source spider and passive scanner |
| Scrapy | Python framework for building custom crawlers |
| Apache Nutch | Large-scale, extensible crawler |

A custom Scrapy-based spider can be run against a seed URL and returns its findings as structured JSON.

```bash
python3 SPIDER_SCRIPT.py https://DOMAIN
```

## What to collect

- **Internal and external links:** reveals site structure and third-party dependencies.
- **Comments:** HTML comments can contain developer notes, paths, or version information.
- **Metadata:** generator tags and author fields can reveal the content management system and its version.
- **Sensitive files:** database connection details, encryption keys, and API keys sometimes appear in scripts or config files.
- **Documents and media:** PDFs and images can contain author names and internal paths in their metadata.
- **Email addresses:** useful for staff enumeration (see [Staff and technology OSINT](/methodology/recon/staff-osint/)).

A structured crawler output typically groups findings into keys such as:

| Key | Contents |
|---|---|
| `emails` | Email addresses on the site |
| `links` | Internal and external URLs |
| `external_files` | Linked documents such as PDFs |
| `js_files` | JavaScript files, which often reference API endpoints |
| `form_fields` | Input fields, which show where data is submitted |
| `images`, `videos`, `audio` | Media references |
| `comments` | HTML comments from the source |

## robots.txt

`robots.txt` tells well-behaved crawlers which paths to avoid. Fetch it first, because the disallowed paths are a map of areas the owner considers sensitive.

```bash
curl -s https://DOMAIN/robots.txt
```

| Directive | Meaning |
|---|---|
| `Disallow` | Paths a crawler should not visit |
| `Allow` | Exceptions to a broader `Disallow` |
| `Crawl-delay` | Seconds to wait between requests |
| `Sitemap` | Location of an XML sitemap listing URLs |

> The robots.txt file is advisory. It is not an access control. Disallowed paths are still reachable if they are not protected, so treat them as leads to test within scope.
{: .warning }

## What to look for

- Pages and directories not linked from navigation, especially those listed in `Disallow` or `Sitemap`.
- JavaScript files that call API endpoints or contain hardcoded values.
- Comments that reveal paths, environment names, or version numbers.
- Parameters in links that suggest injectable inputs, which feed later testing.

## Pitfalls

- Single-page applications load content with JavaScript, so a basic crawler may see only a shell. Use a browser-based spider when content is generated client-side.
- Crawlers can trigger actions such as logout or delete if left unrestricted. Exclude those paths from the scope.
- Excessive request rates can disrupt the target. Set delays and limits that match the engagement rules.

## Defense and prevention

- Do not rely on robots.txt to hide sensitive paths. Protect them with authentication.
- Remove developer comments and debugging information from production output.
- Keep secrets out of client-side JavaScript and configuration files that are served publicly.
