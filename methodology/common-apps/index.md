---
layout: page
title: "Common Applications"
subtitle: "Discovery, fingerprinting and attack workflows for widely deployed web applications"
permalink: /methodology/common-apps/
---

Most external and internal assessments end up depending on web applications that the organisation did not build: content management systems, servlet containers, build servers, monitoring consoles and support portals. These applications are often forgotten, run with default or weak credentials, or lag behind on patches. The pages in this section follow the same sequence for each product: discover the instance, fingerprint its version, enumerate the functions and accounts it exposes, check default credentials and known issues, and only then attempt exploitation. Start with application discovery to build the list of targets, then move to the page for each product you find.

## Checklist

- ☐ Build the list of web services from port scans and triage the results with screenshots before testing any application.
- ☐ Fingerprint each application: name, version and the components it loads, such as plugins, themes and modules.
- ☐ Enumerate users, paths, admin consoles and exposed files appropriate to the product.
- ☐ Check default and weak credentials, observing lockout limits before any password attempts.
- ☐ Search for known issues for the exact version, and confirm them before relying on them.
- ☐ Prefer proofs of impact that do not change the target, such as reading a file or running `id`.
- ☐ Record the version, the request, the response and the evidence for each application in the notes.
- ☐ Review the prevention page for the hardening points that apply to the applications found.

## Pages in this section

- [Application Discovery and Enumeration](/methodology/common-apps/application-discovery/)
- [WordPress](/methodology/common-apps/wordpress/)
- [Drupal](/methodology/common-apps/drupal/)
- [Joomla](/methodology/common-apps/joomla/)
- [Tomcat](/methodology/common-apps/tomcat/)
- [Jenkins](/methodology/common-apps/jenkins/)
- [GitLab](/methodology/common-apps/gitlab/)
- [osTicket](/methodology/common-apps/osticket/)
- [ColdFusion](/methodology/common-apps/coldfusion/)
- [IIS Tilde Enumeration](/methodology/common-apps/iis-tilde-enumeration/)
- [LDAP](/methodology/common-apps/ldap/)
- [Splunk](/methodology/common-apps/splunk/)
- [PRTG Network Monitor](/methodology/common-apps/prtg/)
- [Thick Client Applications](/methodology/common-apps/thick-client-apps/)
- [CGI, Shellshock and Tomcat CGI](/methodology/common-apps/cgi-shellshock/)
- [Mass Assignment](/methodology/common-apps/mass-assignment/)
- [Application Hardening](/methodology/common-apps/prevention/)
