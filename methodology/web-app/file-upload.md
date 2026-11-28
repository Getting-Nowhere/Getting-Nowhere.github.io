---
layout: page
title: "File Upload Attacks"
subtitle: "Testing upload validation and turning an accepted file into code execution or a client-side attack"
permalink: /methodology/web-app/file-upload/
---

File upload features are dangerous when the server stores an uploaded file where it can be requested, and does not verify what the file is. If the server executes the stored file, the attacker gains command execution. If the file is served to other users, it can carry stored XSS or XXE. The task is to determine what validation exists, where it runs, and whether an uploaded file can be requested and executed.

## Workflow

1. Map the upload function. Identify the framework from the URLs and extensions. Request `/index.php`, `/index.asp` and `/index.aspx` to see which one responds. Browser extensions such as Wappalyzer can also identify the stack. Note any error messages, the accepted types shown in the interface, and whether the form reloads.

2. Test a harmless file first. Upload a file containing `<?php echo "Hello";?>` named `test.php`. If the upload is accepted, request the returned path:

```text
http://TARGET_IP:TARGET_PORT/uploads/test.php
```

If the output "Hello" appears, the file is executed. If the source is shown or the file is downloaded, the server does not execute it in that directory. If no path is returned, fuzz for the upload directory.

3. Bypass client-side checks. Validation in JavaScript does not reach the server. Two approaches work:

- Intercept the upload request in a proxy and change the `filename` value in the multipart part.
- Remove the client-side check in the developer tools, for example by deleting the `onchange` handler and the `accept` attribute from the file input. The change lasts only until the page reloads.

4. Bypass the extension check.

- Blacklist: fuzz alternative extensions, such as `.phtml`, and compare response lengths. Only some extensions execute on a given configuration.
- Whitelist with an unanchored regex: `shell.jpg.php` passes a check that looks for `.jpg` anywhere in the name.
- Server configuration: a `FilesMatch` rule that maps `.phar`, `.php` and `.phtml` to the PHP handler can be exploited with a double extension such as `shell.php.jpg`.
- Character injection: generate candidate names with separator characters before and after each extension:

```bash
for char in '%20' '%0a' '%00' '%0d0a' '/' '.\\' '.' '…' ':'; do
    for ext in '.php' '.phps'; do
        echo "shell$char$ext.jpg" >> wordlist.txt
        echo "shell$ext$char.jpg" >> wordlist.txt
        echo "shell.jpg$char$ext" >> wordlist.txt
        echo "shell.jpg$ext$char" >> wordlist.txt
    done
done
```

Null bytes work only on PHP 5.x and earlier. A colon in a Windows name, such as `shell.aspx:jpg`, can be used on IIS.

5. Bypass content checks. Two checks are common:

- `Content-Type` header: this is set by the browser and is part of the multipart section for the file, near the bottom of the request. Change that header, not the one at the top of the request, when the file is sent as multipart data.
- MIME type from the file signature: `mime_content_type()` reads the first bytes. Place a valid signature, such as `GIF87a`, at the start of the file, then keep the executable content after it.

Combine the checks where needed. An allowed MIME type with a disallowed extension, or the reverse, can expose a check that tests only one of them.

6. Attack files that are not executed. Restricted uploads can still carry client-side or XML payloads:

| File | Attack | Method |
|---|---|---|
| HTML or SVG | Stored XSS | Script inside the file, served to other users |
| JPG or PNG | XSS in metadata | Set a Comment or Artist value that the page displays |
| SVG or XML-based office files | XXE | Declare an external entity that reads a local file |
| ZIP | Denial of service | Decompression bomb with nested archives |
| JPG | Denial of service | Pixel flood by altering the declared dimensions |
| Any | Command injection through the name | Name such as `file$(whoami).jpg` used in a shell command |

Metadata payload example:

```bash
exiftool -Comment=' "><img src=1 onerror=alert(window.origin)>' HTB.jpg
```

SVG XXE example that reads a local file:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg [ <!ENTITY xxe SYSTEM "file:///etc/passwd"> ]>
<svg>&xxe;</svg>
```

7. Disclose the upload directory. When the upload form does not return a link, force an error. Uploading a file with a name that already exists, or sending two identical requests at once, can produce a message that reveals the path.

8. Windows-specific names. Reserved device names such as `CON`, `NUL`, `COM1` and `LPT1` can cause unexpected behaviour. Characters with wildcard meaning such as `*` and `?`, and 8.3 short names such as `HAC~1.TXT`, may refer to existing files.

## What to look for

- Whether the uploaded file is requested, and whether it executes or downloads.
- A mismatch between the extension, the `Content-Type` header and the file signature.
- A returned path, an error message, or a file name that appears in the page.
- Client-side only validation. Any check that the server does not repeat is not a control.

## Pitfalls

- Some extensions execute only on specific server configurations. Test each one.
- Client-side changes are temporary. Repeat them after every page reload.
- Overwriting an existing file can break the application. Test only in scope.
- A file that uploads successfully is not proof of execution. Request it and check the response.

> Defense: allowlist extensions and check content on the server, store uploads outside the web root under random names, and serve them through a download script that sends `Content-Disposition` and `X-Content-Type-Options: nosniff`. See [Prevention and remediation](/methodology/web-app/prevention/).
{: .info }
