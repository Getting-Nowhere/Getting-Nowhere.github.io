---
layout: page
title: "Application Discovery and Enumeration"
subtitle: "Scoping web services, scanning for application ports and triaging screenshots"
permalink: /methodology/common-apps/application-discovery/
---

Application discovery turns a list of hosts into a list of named applications with versions. It is the stage where most of the later findings are decided, because a version or a plugin name tells you which known issues to check. Keep the work organised from the start: record the scope, scan in a repeatable way, and triage the output into a short list of interesting hosts before testing any of them.

## Workflow

1. **Record the scope and working notes.** Capture the in-scope ranges and URLs, testing windows, fragile hosts, client contacts and any credentials provided. Use a consistent note structure so that discovery, application findings and exploitation can be traced later.
2. **Scan for web ports.** Use a focused list of common web ports, then extend it if the environment suggests other ports.

```bash
$ nmap -p 80,443,8000,8080,8180,8888,10000 --open -oA web_discovery -iL scope_list
```

3. **Run a service and version scan on live hosts.** Version detection tells you which application family is behind each port.

```bash
$ sudo nmap --open -sV TARGET_IP
```

4. **Triage with screenshots.** A large number of web services is easier to review visually. EyeWitness reads the Nmap XML and produces screenshots and a report.

```bash
$ eyewitness --web -x web_discovery.xml -d OUTPUT_DIR
```

5. **Fingerprint from the response.** Read the page source, headers, footers, `robots.txt` and the `generator` meta tag. Look for product names, paths such as `/wp-content/`, `/administrator/` or `/CFIDE/`, and error pages that name the server.
6. **Pick the matching page.** Once the application is named, move to its page and repeat the fingerprinting for the version.

## Port and product reference

| Port | Typical application seen in notes | Start with |
| --- | --- | --- |
| 80, 443 | IIS or Apache hosting a CMS or custom app | Fingerprint the page, then the CMS |
| 8000, 8089 | Splunk web and management API | [Splunk](/methodology/common-apps/splunk/) |
| 8080 | Tomcat, PRTG or Jenkins | [Tomcat](/methodology/common-apps/tomcat/), [PRTG](/methodology/common-apps/prtg/), [Jenkins](/methodology/common-apps/jenkins/) |
| 8500 | ColdFusion | [ColdFusion](/methodology/common-apps/coldfusion/) |
| 8009 | AJP connector to Tomcat | [Tomcat](/methodology/common-apps/tomcat/) |

## Other applications worth checking

Scan data often contains products that are not covered by a dedicated page. These are worth a default-credential check and a version lookup:

- **Axis2**, often running on Tomcat, where an administrator login can allow service upload.
- **WebSphere**, where a default administrative console login can allow application deployment.
- **Elasticsearch**, where old installs may expose unauthenticated APIs.
- **Zabbix** and **Nagios**, monitoring products with a history of injection and code execution issues.
- **WebLogic**, an application server with a long list of deserialization issues.
- **Wikis, intranets and SharePoint**, where search functions have exposed credentials.
- **vCenter**, which may run as a privileged account and is often missed by scanners.

> Scanners miss many of these. Review every discovered web service, not only the ones that the scanner rated highly.
{: .info }

## Pitfalls

- Virtual hosting changes the application. A WordPress exploit run against the bare IP fails with a "not WordPress" message until the correct `Host` header is supplied. Add discovered hostnames to the hosts file, or set the header explicitly.
- Non-standard ports hide applications. Scan all ports on hosts with a web signature.
- A screenshot shows a page but not a version. Confirm versions before relying on a vulnerability.

## Defense

Maintain a current inventory of applications and remove anything that is no longer needed. See [Application Hardening](/methodology/common-apps/prevention/).
