---
layout: page
title: "GitLab"
subtitle: "Enumerating GitLab accounts, public projects and versions, and testing authenticated code execution"
permalink: /methodology/common-apps/gitlab/
---

GitLab is a self-hosted Git platform with wiki, issue tracking and CI/CD features. It is often found on internal networks and sometimes on the internet. Repositories are a rich source of information, because scripts, configuration files and SSH keys are sometimes committed in plain text. Registration forms and login responses can reveal accounts, and older releases had known authenticated code execution issues.

## 1. Discover and fingerprint

- The GitLab logo and login page identify the application.
- The version is shown on the `/help` page once you are logged in. Without an account, the version is hard to confirm.

## 2. Review public content

- Browse `/explore` for public projects, snippets and groups. Public projects can reveal internal hostnames, code and sometimes credentials.
- Search repositories for secrets. Check configuration files, `.env` files, CI definitions and history, since removed secrets remain in old commits.

```bash
$ git clone https://gitlab.example.invalid/GROUP/PROJECT.git
$ git log -p | grep -iE "password|secret|token|BEGIN .* PRIVATE KEY"
```

> Replace the placeholder host with the in-scope GitLab instance. The search pattern is a starting point and will return false positives.
{: .info }

## 3. Enumerate accounts

- The registration form can confirm that an account exists. An attempt to register an in-use email address returns a message that the email has been taken.
- Login responses should be compared for valid and invalid usernames. A username list from OSINT can be checked against the login form.
- The notes describe a simple script that tests a list of usernames against the login endpoint.

Lockout behaviour matters. Before GitLab 16.6, the defaults were 10 failed attempts and an automatic unlock after 10 minutes. From 16.6, administrators can set these values in the admin area. Confirm the settings before any spraying, and keep the attempt rate low.

## 4. Test authenticated code execution

Older community edition releases, 13.10.2 and lower, had an authenticated remote code execution issue related to ExifTool processing of metadata in uploaded images. Public exploits exist for this issue. If self-registration is enabled on a vulnerable release, a test account can be created and used.

```bash
$ python3 EXPLOIT_SCRIPT -t http://TARGET_URL:PORT -u USERNAME -p PASSWORD -c 'COMMAND'
```

Use a benign command for the first test, such as `id`. A reverse shell is a separate step and needs approval.

> Public exploit scripts that run commands are not safe to use unchanged. Read the script before running it, and point it only at in-scope hosts.
{: .warning }

## Decision points

- Public projects contain credentials: test them against the platform and other in-scope services.
- Self-registration open and version is 13.10.2 or lower: consider the authenticated issue.
- Valid usernames found, no lockout policy confirmed: stop and check the policy first.
- Recent release: no version-based test. Focus on configuration and secrets.

## Defense

Enforce sign-up restrictions, such as admin approval for new users and allowed or denied email domains. Enable two-factor authentication, keep the instance patched, and avoid public projects that contain internal code. See [Application Hardening](/methodology/common-apps/prevention/).
