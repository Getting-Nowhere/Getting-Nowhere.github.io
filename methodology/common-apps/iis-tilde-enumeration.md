---
layout: page
title: "IIS Tilde Enumeration"
subtitle: "Discovering hidden IIS files and directories through 8.3 short names"
permalink: /methodology/common-apps/iis-tilde-enumeration/
---

On Windows, every file and directory has an 8.3 short name: up to six characters of the name, a tilde and a sequence number, and up to three characters of extension. Some IIS versions respond differently to requests for a short name that exists and one that does not. That difference lets a tester enumerate names that are not linked from any page, including directories that are hidden from the index and files that are not in the browser's view. The technique reveals names, and the names are then used to request the actual files.

## 1. Confirm the target

Scan the host to identify IIS and its version. Tilde enumeration was recorded in the notes against IIS 7.5, and it is worth testing any IIS instance that accepts `OPTIONS` or `GET` requests on the `~` paths.

```bash
$ nmap -p- -sV -sC --open TARGET_IP
```

## 2. Probe with the short-name scanner

The IIS short name scanner automates the test. It sends requests with tilde patterns, and it reports identified directories and files, including the first six characters of each name and the extension if it can be found.

```bash
$ java -jar iis_shortname_scanner.jar 0 5 http://TARGET_URL/
```

Read the report carefully. A result like `Vulnerable!` with a method and suffix tells you which request pattern worked. Entries such as `ASPNET~1` identify directories, and short file names such as `TRANSF~1.ASP` identify files.

## 3. Complete the name

A short name is truncated, so the full name has to be recovered. Build a candidate list from the first characters of the short name and match it against wordlists that contain the same prefix. Then test the candidates with an enumerator.

```bash
$ egrep -r "^transf" /usr/share/wordlists/* | sed 's/^[^:]*://' > candidates.txt
$ gobuster dir -u http://TARGET_URL/ -w candidates.txt -x .aspx,.asp
```

The `egrep` command finds words in the wordlists that begin with the known prefix, and the `sed` command removes the file names from the output. The gobuster run then tests each candidate with the file extensions identified by the scanner.

## What to look for

| Response | Meaning |
| --- | --- |
| `404` on a tilde pattern with no match | No short name starts with that prefix |
| `200` on a pattern that matches | A short name exists with that prefix |
| A file that returns `200` on the full name | Hidden resource identified |
| A file returns a denial on GET but a name is known | Try the same name with other methods, as in [HTTP Verb Tampering](/methodology/web-attacks/http-verb-tampering/) |

## Pitfalls

- The scanner's results can include false positives or partial names. Confirm each file by requesting it.
- Some files are visible only through a short name and are denied by IIS as a full path. Check whether any other control protects them.
- Many requests in a short time may trigger rate limits or monitoring. Adjust the thread count to the rules of engagement.

## Defense

Keep IIS updated, and disable 8.3 short name generation on volumes that host web content. Restrict anonymous access to directories and remove files that should not be deployed to the web root. See [Application Hardening](/methodology/common-apps/prevention/).
