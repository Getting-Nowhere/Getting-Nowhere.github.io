---
layout: page
title: "Prevention and Remediation"
subtitle: "Defensive controls and report recommendations for each web application vulnerability class"
permalink: /methodology/web-app/prevention/
---

Every web application finding should end with a recommendation that removes the root cause, not only the payload that proved it. This page lists the controls that address each class covered in this section, and the server settings that limit the damage when a control fails. Use it to write the remediation part of a report, and to check whether the client's defences were in place.

## Principles

- Client-side checks improve usability. Enforce every rule on the server, because requests can be replayed or edited.
- Validate, sanitise and encode at the boundaries. Validate input format, sanitise what the format does not allow, and encode output for the context where it is written.
- Use built-in functions in place of shell or raw-text functions where one exists.
- Run the web server, the application and the database account with the least privilege that works.
- Treat a web application firewall and security headers as secondary layers, not the fix.

## Controls by vulnerability class

| Class | Root cause | Primary control | Secondary control |
|---|---|---|---|
| SQL injection | Input concatenated into the query | Parameterised queries. Escaping special characters only as a fallback | Allowlist validation for fixed formats. Database account without `FILE` privilege |
| Cross-site scripting | Untrusted data written to HTML or script | Output encoding such as `htmlentities()`, DOMPurify for input that must allow HTML. Avoid `innerHTML`, `document.write()` and jQuery `html()` | Content Security Policy, `HttpOnly` and `Secure` cookies, `X-Content-Type-Options: nosniff` |
| Command injection | Input passed to a shell | Avoid shell functions. Use built-ins such as `fsockopen` for connectivity tests | Low-privilege web user, `disable_functions` for shell functions |
| File inclusion | Input used in an include path | Map a fixed set of page names to files. Never use raw input in a path | `open_basedir` to limit readable directories |
| File upload | Extension, content and location not checked on the server | Extension allowlist plus a blacklist of executable extensions. Check both `Content-Type` and the file signature. Random storage names | Serve files through a download script. Return `403` for the upload directory. Size limits and malware scanning |
| Login brute forcing | No limit on attempts | Rate limiting and account lockout after repeated failures | Identical failure messages. Stronger authentication for administrators |
| Vhost and subdomain exposure | Unused or forgotten hostnames still served | Remove stale DNS records and virtual hosts. Serve only intended hostnames | Default response for unknown `Host` values |

## Code examples

Parameterised query, which keeps input out of the query text (PHP with mysqli):

```php
$stmt = $conn->prepare("SELECT * FROM logins WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
```

Allowlist validation for a fixed format, such as a port code made only of letters and spaces:

```php
$pattern = "/^[A-Za-z\s]+$/";
if (!preg_match($pattern, $_GET["port_code"])) {
    die("Invalid input");
}
```

Validation of an IP address with the built-in filter, then rejection of anything else:

```php
if (filter_var($_GET['ip'], FILTER_VALIDATE_IP)) {
    // call function
} else {
    // deny request
}
```

Output encoding before a value is displayed:

```php
echo htmlentities($_GET['email']);
```

Upload checks that match both the extension and the content:

```php
$fileName = basename($_FILES["uploadFile"]["name"]);
if (!preg_match('/^.*\.(jpg|jpeg|png|gif)$/', $fileName)) {
    die("Only images are allowed");
}
```

Anchoring the pattern with `$` matters. An unanchored check accepts `shell.jpg.php`.

## Server configuration

- Use HTTPS across the whole domain.
- Send `Content-Security-Policy` with `script-src 'self'`, and `X-Content-Type-Options: nosniff`.
- Set `HttpOnly` and `Secure` on session cookies.
- Disable dangerous PHP functions with `disable_functions`, for example `exec`, `shell_exec`, `system` and `passthru`.
- Restrict file access with `open_basedir`.
- Run the web server as a low-privilege user such as `www-data`.
- Reject double-encoded requests and non-ASCII characters in URLs.
- Do not show raw system or server errors to users. Return simple messages that do not reveal file names or paths.
- Remove outdated components, such as PHP CGI, that are no longer needed.
- Limit upload size and update libraries that handle files or XML.

## Reporting checklist

For each finding, record:

1. The vulnerable input, the request and the response that proved it.
2. The control that was missing, using the table above.
3. The recommended fix, with a code change where one applies.
4. The defence that would have limited the impact if the primary control failed.
5. A retest after the fix, using the same request.

Writing the recommendation during testing keeps the report consistent. A pentest finds the issues that are visible at one point in time. Developers should also review new code for the same patterns, because a single missed check in a large codebase can reintroduce a vulnerability.
