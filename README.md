# CPTS Notes: Jekyll site for GitHub Pages

A dark, terminal-style blog with a hero, featured post, category filter chips, post cards, table of contents, code blocks with copy buttons, categories / tags / archives pages and RSS.

## Deploy in 5 minutes

1. On GitHub, create a **public** repository named exactly `YOURUSERNAME.github.io`.
2. Upload everything in this folder to that repo (or `git push` it).
3. In the repo go to **Settings → Pages** and set **Source** to *Deploy from a branch*, branch `main`, folder `/ (root)`.
4. Wait about a minute, then open `https://YOURUSERNAME.github.io`.

## First edits

| File | Change |
| --- | --- |
| `_config.yml` | `title`, `url`, `description`, `social` links, hero stats |
| `_layouts/home.html` | Hero headline and subtitle (`<mark>` = highlight, `<del>` = strike) |
| `assets/img/avatar.svg` | Replace with your own picture (`avatar.jpg` also works; update `home.html`) |
| `about.md` | Your story |
| `_posts/` | Delete the samples, add your own |

## Writing a post

Create `_posts/YYYY-MM-DD-title.md`:

```yaml
---
title: "Post title"
date: 2026-11-26 09:00:00 +0530
categories: [CPTS, Web]     # these become the filter chips
tags: [sqli, web]
description: One-line summary for cards.
cover: /assets/img/covers/x.png   # optional
featured: true                    # optional
badge: "NEW"                      # optional
---
```

Callouts: add `{: .tip }`, `{: .info }`, `{: .warning }` or `{: .danger }` on the line after a blockquote.

## Run locally (optional)

```bash
bundle install
bundle exec jekyll serve
# open http://localhost:4000
```

## Re-colour the site

All colours live in the `:root` block at the top of `assets/css/style.css`. Change `--accent` to restyle everything in one line.
