---
layout: page
title: "Web Shells"
subtitle: "Using prebuilt ASP.NET and PHP web shells and bypassing a naive upload filter"
permalink: /methodology/shells-and-transfers/web-shells/
---

**Purpose:** obtain command execution through a script file that runs on the web server, usually after an upload function is found. A web shell is useful when outbound connections are blocked, because it works over the web port that is already open.

## Workflow

1. Identify a file upload function, and the server technology (ASP.NET, PHP, and so on).
2. Choose a web shell that matches the server technology. Prebuilt shells are kept under the Laudanum collection, which is normally found at `/usr/share/laudanum`.
3. Attempt the upload. If the filter rejects the file, check which check it is applying (see below).
4. Locate the uploaded file and request it in a browser or with curl.
5. Confirm execution with a harmless command before doing anything else.

Requesting an uploaded ASPX shell on a Windows IIS host:

```text
http://WEB_HOST/files/shell.aspx
```

The uploaded file lives in a web-accessible directory on disk. In the example from the notes, the file is in a `files` folder beneath the IIS web root, so the URL path mirrors that folder.

## Antak web shell (ASP.NET)

Antak is a PowerShell-based web shell from the Nishang project. It runs commands through PowerShell and presents a graphical interface, which makes it useful on Windows servers.

- Edit the username and password inside the shell before uploading it. Antak authenticates with those values, so an unedited copy will not be usable.
- ASPX is the file extension used by ASP.NET pages. The server renders the page and returns HTML to the client.

## PHP web shells

PHP is the most common server-side language in typical web stacks, so PHP web shells are widely used. Choose a shell that matches the PHP version and upload restrictions.

## Bypassing a Content-Type filter

Suppose the upload form accepts only image types and rejects `shell.php`. The notes describe a request-level change:

1. Intercept the upload request in an intercepting proxy.
2. Change the `Content-Type` header from `application/x-php` to `image/gif`.
3. Forward the request. Repeat if the first attempt is rejected.

The technique works because the server trusts the declared header more than the file content.

## What to look for

- The file extension accepted by the upload form, and whether the server checks it, the header, the content or all three
- The storage path of uploads, and whether it is reachable through the web server
- Whether the uploaded file executes or is served as plain text. A plain-text response means the server is not running the script engine for that directory.

## Pitfalls

- A web shell uploaded with the wrong extension will be served as text rather than executed.
- An unedited Antak shell will fail to authenticate.
- Leaving a web shell in place after the test is a finding in its own right. Remove it and record its path.

> A web shell is a persistent, unauthenticated back door once it is reachable. Clean up any shell placed during the engagement.
{: .danger }

## Defense and prevention

Validate uploads on the server by extension, by content type detected from the file itself, and by size. Store uploads outside the web root, or in directories where the script engine does not run. Do not trust client-supplied `Content-Type` headers. Restrict the web-server account's write access to upload directories only.
