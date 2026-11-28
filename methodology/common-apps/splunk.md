---
layout: page
title: "Splunk"
subtitle: "Discovering Splunk web and management ports, checking default logons, and gaining code execution through a custom app"
permalink: /methodology/common-apps/splunk/
---

Splunk indexes and searches machine data such as logs and metrics. It is common on internal networks, where it often runs as root on Linux or as SYSTEM on Windows, which makes it a high-value target. The free edition does not require authentication, and a forgotten trial instance may have quietly converted to it. This page covers discovery, the default logon checks, and the code execution path through a custom application with a scripted input.

## Discovery

The web interface listens on TCP 8000. The management port for the REST API is TCP 8089. A version scan shows both:

```bash
sudo nmap -sV TARGET_IP
```

Look for `Splunkd httpd` on 8000 and 8089. The web interface is the entry point, and the management API can be queried on its own.

## Authentication checks

1. Browse to the web interface. The free edition, after a trial has lapsed, does not show a login prompt.
2. On older releases the default credentials were `admin:changeme`, and the login page displayed them.
3. Newer releases set the password during installation. If the default fails, test a short list of common weak passwords, such as `admin`, `welcome`, `Welcome1` and `Password123`.
4. Record the lockout behaviour before trying more than a few passwords.

> Splunk accounts can be locked out and an attempt is logged. Keep the list short and confirm it is authorised by the rules of engagement.
{: .warning }

## Enumeration after logon

With access, browse indexed data, run searches, and review installed apps and dashboards. Check the apps list for custom or outdated applications, and check the server's settings for the account it runs as. Splunk supports several code paths: server-side Django apps, REST endpoints, scripted inputs and alert actions. Scripted inputs are the most direct route to code execution.

## Code execution through a custom app

A scripted input runs a script on a schedule. Because Splunk is installed with Python, a Python script is available on every platform, and Bash, PowerShell or batch scripts are available as well. The app uses this directory layout:

```text
splunk_shell/
├── bin/
│   ├── rev.py
│   ├── run.bat
│   └── run.ps1
└── default/
    └── inputs.conf
```

The `bin` directory holds the scripts. The `default` directory holds `inputs.conf`, which enables the script and sets its interval. A typical entry for a batch launcher is:

```ini
[script://.\bin\run.bat]
disabled = 0
sourcetype = shell
interval = 10
```

The batch file starts the PowerShell script, and the PowerShell script connects back to the attack host. Start a listener on ATTACKER_IP before uploading the app. Package the directory and upload it through the web interface under Apps, then choose install from file:

```bash
tar -czf updater.tar.gz splunk_shell/
```

For a Linux host, edit `rev.py` to connect to ATTACKER_IP on the chosen port and spawn a shell, then package the app the same way.

> Use a callback to an approved listener as the proof of execution, and record the app name so it can be removed. Do not leave the app installed after testing.
{: .tip }

## What to look for

- A Splunk instance with no authentication, or with a default password.
- The privilege level of the service. A shell running as SYSTEM or root is the expected outcome, and it is a strong finding.
- Credentials in configuration files or in the registry on Windows, which may support lateral movement.
- A deployment server. If the host pushes apps to forwarders, an app placed in the deployment apps directory can reach every host that receives it.

## Pitfalls

- An unlicensed or expired trial can change the authentication behaviour. Check the license state before reporting the instance as open.
- Uploads that fail often reflect a package layout error. Confirm the directory names and the tarball structure.

## Defense and prevention

Change the default password, and confirm that the instance is licensed so authentication is enforced. Restrict the web and management ports to administrative networks. Run the service under a dedicated, least-privilege account, and restrict who can install apps. Review installed apps and alert actions regularly. See the [application hardening](/methodology/common-apps/prevention/) page.
