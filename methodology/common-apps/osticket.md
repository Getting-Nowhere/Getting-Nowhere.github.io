---
layout: page
title: "osTicket"
subtitle: "Identifying osTicket support portals and using exposed support data and credentials"
permalink: /methodology/common-apps/osticket/
---

osTicket is an open source support ticketing system written in PHP with a MySQL backend. It collects requests from email, phone and web forms into a single queue. Support tools are often exposed to the internet so that customers can open and track tickets, and they tend to hold a lot of information about staff, customers and internal systems. A test of osTicket is usually a test of what the support portal reveals and what its users reuse.

## 1. Discover and fingerprint

- The osTicket logo and "Powered by" text are common on the landing page.
- The `OSTSESSID` cookie is set on the first visit and is a reliable marker.
- Nmap reports only the web server, so identify osTicket from the page or the cookie rather than from the port scan.

```bash
$ curl -sI http://TARGET_URL/ | grep -i ostsessid
```

## 2. Look for exposed support data

- Support portals reveal internal email addresses. A ticket submitted by the tester may show the company's support address or a temporary internal address assigned to the ticket.
- These addresses can be used to register for other services that require a company email address, such as chat or code hosting platforms.
- Support staff accounts may reuse passwords from breach data. Credentials recovered through OSINT should be tested only within the agreed scope.

> Breach datasets often contain credentials for the company's domain. Treat them as sensitive, record only what is needed for the report, and never store full records in client notes.
{: .info }

## 3. Test the staff and admin login

Only staff and administrators can reach the admin panel. Test recovered credentials against the staff login. A successful login may show internal ticket content, which can contain other credentials, hostnames or procedures.

Check the same passwords against other exposed services in scope, such as VPN portals, since staff often reuse passwords. Reuse testing should respect the lockout policy of each service.

## 4. Check known issues

Searching exploit databases for osTicket returns several issue classes, including remote file inclusion, SQL injection, arbitrary file upload and cross-site scripting. Version 1.14.1 is recorded in the notes as affected by CVE-2020-24881, a server-side request forgery issue. An SSRF can reach internal services that are not exposed to the internet, and it can be used for internal port scanning where the rules of engagement allow it.

## Decision points

- Support portal with self-registration: create a test ticket and note any internal addresses returned.
- Credentials recovered: test against the staff login and then against other in-scope services.
- Version 1.14.1 or earlier identified: check the SSRF issue and confirm with a benign request to an internal address.
- Portal reachable only from internal networks: record the exposure and check the access controls.

## Defense

Limit access to the support portal and admin panel from the internet where possible, require two-factor authentication for staff, restrict which email domains can be used for ticket submission, and keep osTicket current. See [Application Hardening](/methodology/common-apps/prevention/).
