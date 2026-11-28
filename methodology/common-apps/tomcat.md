---
layout: page
title: "Tomcat"
subtitle: "Fingerprinting Apache Tomcat, finding the manager applications and reviewing deployment files"
permalink: /methodology/common-apps/tomcat/
---

Apache Tomcat is a Java servlet container. Its manager applications allow administrators to deploy and manage web applications, which makes weak credentials on the manager a direct route to code execution. Tomcat also stores configuration and deployment files that reveal application logic, credentials and paths. For the CGI servlet, see [CGI, Shellshock and Tomcat CGI](/methodology/common-apps/cgi-shellshock/).

## 1. Discover and fingerprint

- The `Server` header can name Tomcat, but a reverse proxy may hide it. An invalid page request often returns the default Tomcat error page with the version.
- The `/docs/` path, when present, shows the version in the page title.

```bash
$ curl -s http://TARGET_URL:8080/docs/ | grep Tomcat
```

Tomcat listens on 8080 by default. The AJP connector on 8009 is also worth noting in scan output.

## 2. Understand the default layout

| Path | Contents |
| --- | --- |
| `conf/tomcat-users.xml` | Manager users, passwords and roles |
| `conf/web.xml` | Global deployment descriptor |
| `webapps/ROOT/` | Default web root |
| `webapps/manager/`, `webapps/host-manager/` | Management applications |
| `webapps/APP/WEB-INF/web.xml` | Routes and servlet classes for the application |
| `webapps/APP/WEB-INF/classes/` and `lib/` | Compiled business logic and dependencies |

The `WEB-INF/web.xml` file is the most useful file to read after a file inclusion issue. It maps URLs to classes, and each class name points to a `.class` file under `WEB-INF/classes`, which can then be decompiled.

## 3. Enumerate the management applications

Look for the manager and host manager paths, then test default and weak credentials. Lockout behaviour applies here too.

```bash
$ gobuster dir -u http://TARGET_URL:8180/ -w WORDLIST
```

The manager pages use HTTP Basic authentication, so a `401` response confirms they exist. Check the credentials that the `tomcat-users.xml` file would contain if the default configuration was used, and test only the pairs that are in scope.

> Commented-out example users in `tomcat-users.xml` are often copied into production. If you can read this file through another weakness, check whether any of its users are active.
{: .warning }

## 4. Exploit

With valid manager credentials, the manager application can deploy a web application archive. The archive contains a server-side page that accepts commands. Use a minimal handler, record the deployment, and undeploy it after testing.

If a local file inclusion issue is present, read `WEB-INF/web.xml` first. The file reveals paths for other servlets, which may be less protected than the main application.

## Decision points

- Manager reachable from the network and default or weak credentials work: test deployment.
- Manager restricted to localhost: look for other applications and read configuration through other weaknesses.
- Version identified: check CGI servlet and other version-specific issues, such as the CGI issue on the linked page.
- Application logic available: decompile classes and review input handling.

## Defense

Limit the manager and host manager applications to localhost, or enforce IP allow lists with strong, non-standard credentials. Use the `http-method-omission` approach described in [Web Attacks Prevention](/methodology/web-attacks/prevention/) rather than limiting a control to one method. See also [Application Hardening](/methodology/common-apps/prevention/).
