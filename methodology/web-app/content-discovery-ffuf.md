---
layout: page
title: "Content Discovery with ffuf"
subtitle: "Finding directories, pages and extensions that the application does not link to"
permalink: /methodology/web-app/content-discovery-ffuf/
---

Content discovery finds directories, pages and file extensions that the application does not link to from its visible pages. ffuf replaces a keyword, `FUZZ`, in the URL, header or body with each entry from a wordlist and reports the responses. The result shows what exists on the server, which is the input for the parameter, injection and authentication tests that follow.

## Workflow

1. Select a wordlist from a standard collection such as SecLists (`Discovery/Web-Content`). Start with a small list and expand only if needed.
2. Fuzz directory names. Place `FUZZ` where the directory name would appear. The `:FUZZ` suffix assigns the keyword to the wordlist, and `-t` sets the number of threads:

```bash
ffuf -w /opt/useful/seclists/Discovery/Web-Content/directory-list-2.3-small.txt:FUZZ -u http://TARGET_IP:TARGET_PORT/FUZZ -t 200
```

3. Identify the server stack from the response headers. Apache commonly implies `.php`; IIS commonly implies `.asp` or `.aspx`. Use this to choose the extension list.
4. Fuzz extensions on a file name known to exist, usually `index`. The extension wordlist already includes the leading dot, so no dot is added after `index`:

```bash
ffuf -w /opt/useful/seclists/Discovery/Web-Content/web-extensions.txt:FUZZ -u http://TARGET_IP:TARGET_PORT/blog/indexFUZZ
```

5. Once an extension is confirmed, fuzz page names with it fixed:

```bash
ffuf -w /opt/useful/seclists/Discovery/Web-Content/directory-list-2.3-small.txt:FUZZ -u http://TARGET_IP:TARGET_PORT/blog/FUZZ.php
```

6. Recurse into discovered directories. Limit the depth, because each level multiplies the number of requests. `-e` adds an extension and `-v` prints full URLs:

```bash
ffuf -w /opt/useful/seclists/Discovery/Web-Content/directory-list-2.3-small.txt:FUZZ -u http://TARGET_IP:TARGET_PORT/FUZZ -recursion -recursion-depth 1 -e .php -v
```

## Filtering

Most servers return the same "not found" page for every miss. Measure its size, then filter it out with `-fs SIZE` and rerun, so that real hits remain visible. `-fw` (words) and `-fl` (lines) apply the same idea when the size varies.

## What to look for

- Every status code, not only 200. A 301, 302 or 403 proves the path exists. Forbidden or redirecting pages can still expose useful content when read through another vulnerability, so record them.
- Responses of unusual size that do not match the baseline.
- Administrative, backup, configuration and login paths. Record them for the parameter and authentication phases.
- Extensions that the server processes differently from the rest, which can indicate a different handler.

## Pitfalls

- A large list at high thread counts can overload a fragile server or trigger rate limiting. Start small and scale up.
- Placing `FUZZ` in the wrong position, such as `.FUZZ` instead of `FUZZ.php`, changes the search entirely.
- Recursion without a depth limit creates very large request volumes.
- Looking only at 200 responses hides the most useful hits.
- Filters copied from another target may hide every hit. Re-measure the baseline on each target.

{: .info }
