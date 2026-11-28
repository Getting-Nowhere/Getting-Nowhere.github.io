---
layout: page
title: "ColdFusion"
subtitle: "Fingerprinting Adobe ColdFusion, reading configuration files and testing known remote code execution"
permalink: /methodology/common-apps/coldfusion/
---

Adobe ColdFusion is a Java-based application platform that uses the ColdFusion Markup Language (CFML). Its administrator console, default directories and built-in tags make it recognisable, and older releases have several well-known issues: a directory traversal in the administrator pages, an unauthenticated file read, and an unauthenticated upload that leads to code execution. Version identification is the decision point for almost every step.

## 1. Discover and fingerprint

- Common ports include 80 and 443 for the web server, and 8500 for ColdFusion's built-in web server. Port 1935 and 5500 are also associated with ColdFusion services.
- ColdFusion pages use `.cfm` and `.cfc` extensions. Default paths such as `/CFIDE/administrator/` identify the platform.
- Port 8500 may list `CFIDE` and `cfdocs` directories when browsed.

```bash
$ nmap -p- -sC -Pn TARGET_IP --open
$ curl -s http://TARGET_URL:8500/CFIDE/administrator/index.cfm | head -n 20
```

## 2. Confirm the version

The notes record a ColdFusion 8 administrator login at `/CFIDE/administrator/`. Confirm the version from the login page, the footer or the response headers, and use the version to select the candidate issues.

## 3. Directory traversal in administrator pages

Several ColdFusion administrator pages accept a locale parameter that is not validated. The notes list pages including `CFIDE/administrator/settings/mappings.cfm`, `logging/settings.cfm`, `datasources/index.cfm` and `j2eepackaging/editarchive.cfm`. These were vulnerable in ColdFusion 9.0.1 and earlier. The issue is CVE-2010-2861.

Public exploit scripts read files through this parameter. The file that matters most is the password store, `lib/password.properties`, which holds the encrypted credentials for database and mail connections.

```bash
$ python2 TRAVERSAL_EXPLOIT.py TARGET_IP 8500 "../../../../../../../../ColdFusion8/lib/password.properties"
```

The values in that file are encrypted. Record them as a finding, and handle any recovered secret according to the client's data handling rules.

## 4. Unauthenticated code execution

ColdFusion 8.0.1 and earlier had an unauthenticated upload issue in a bundled FCKeditor connector, recorded as CVE-2009-2265. The upload handler is reachable without a session, and the public exploit uploads a file that can then be executed. The path to test is:

```text
/CFIDE/scripts/ajax/FCKeditor/editor/filemanager/connectors/cfm/upload.cfm?Command=FileUpload&Type=File&CurrentFolder=
```

Public exploits for this issue need their listener address, listener port and target variables updated. Review the script before running it against an in-scope host.

Code can also be executed through unsafe use of the query string. In this pattern, a page passes `cgi.query_string` into a command execution tag, which lets an attacker append commands.

```html
<cfset cmd = "#cgi.query_string#">
<cfexecute name="cmd.exe" arguments="/c #cmd#" timeout="5">
```

> Unauthenticated code execution is a high-impact finding. Confirm it with a benign command and avoid persistence unless the client has approved it.
{: .warning }

## Decision points

- Administrator pages reachable and version 9.0.1 or earlier: test the traversal to read configuration.
- Version 8.0.1 or earlier with the connector exposed: check the unauthenticated upload issue.
- Unexpected query string output: test the query string injection pattern.
- Current release: focus on administrator access controls and default credentials.

## Defense

Restrict the administrator console to trusted networks, remove the bundled FCKeditor connectors, keep ColdFusion patched, and protect the password store. See [Application Hardening](/methodology/common-apps/prevention/).
