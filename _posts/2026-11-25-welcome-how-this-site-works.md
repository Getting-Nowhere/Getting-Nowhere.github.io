---
title: "Welcome: How This Site Works and How to Add a Post"
date: 2026-11-25 10:00:00 +0530
categories: [Site, Guide]
tags: [jekyll, github-pages, meta]
description: A quick guide to publishing your own CPTS notes on this site, including front matter, code blocks, tables, callouts and images.
featured: true
badge: "START HERE"
---

> *Hi, I'm YourHandle.* This post is both a welcome and a cheat sheet for writing on this site. Delete it once you've published your own content.

## Adding a new post

Create a file in the `_posts/` folder named `YYYY-MM-DD-your-title.md`. The top of the file (the *front matter*) tells the site everything about the post:

```yaml
---
title: "SQL Injection Fundamentals"
date: 2026-11-26 09:00:00 +0530
categories: [CPTS, Web]          # first = section, last = shown on cards
tags: [sqli, web, sqlmap]
description: One-sentence summary shown on the home page.
cover: /assets/img/covers/sqli.png   # optional
featured: true                        # optional, pins it to the top
badge: "NEW"                          # optional, label on the featured card
---
```

Commit and push. GitHub Pages rebuilds the site in about a minute.

## Writing content

### Code blocks

Fenced code blocks get syntax highlighting, line numbers, a language label and a **Copy** button automatically:

```bash
# quick TCP scan of every port
sudo nmap -p- --min-rate 5000 -oA scans/full 10.129.0.10
```

### Tables

| Tool    | Use                       |
| ------- | ------------------------- |
| nmap    | Port and service scanning |
| ffuf    | Web content discovery     |
| sqlmap  | Automated SQL injection   |

### Callouts

Add a class under a blockquote to turn it into a callout:

> Always take notes **while** you work. You will not remember it later.
{: .tip }

> Only test systems you own or have written permission to test.
{: .warning }

> Plain blockquotes look like this one.

### Highlights and images

Use `<mark>highlighted</mark>` text for emphasis. Images go in `assets/img/` and are referenced like this, with an italic line right under it as the caption:

```markdown
![Network diagram](/assets/img/my-diagram.png)
*Caption goes here*
```

## Publishing checklist

1. Set `url` and `title` in `_config.yml`
2. Replace the avatar in `assets/img/avatar.svg`
3. Edit the hero headline in `_layouts/home.html`
4. Rewrite `about.md`
5. Delete the sample posts and add your own
