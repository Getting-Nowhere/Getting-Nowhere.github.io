---
layout: page
title: "Web Application Testing"
subtitle: "Phase overview, testing checklist and index of web application techniques"
permalink: /methodology/web-app/
---

Web application testing maps the application's surface, identifies inputs that reach the server or the database, and confirms whether those inputs can change how the application behaves. The work runs in a fixed order: proxy the traffic first, discover content and parameters second, test each input against the vulnerability classes that fit its context, and only then move into authentication attacks and exploitation. Every finding should be reproducible and recorded as it is made, with the exact request, the observed response and the impact, so that the final report can show each step.

## Testing checklist

Work through the items in order. Each item links to the page that covers it.

- ☐ **Proxy setup.** Route the browser and tools through an intercepting proxy, define scope, and confirm that requests and responses are captured. See [Web proxies](/methodology/web-app/web-proxies/).
- ☐ **Content discovery.** Fuzz for directories, pages and file extensions, and record every status code, not only 200 responses. See [Content discovery with ffuf](/methodology/web-app/content-discovery-ffuf/).
- ☐ **Parameter discovery.** Find GET and POST parameters that no form links to, then fuzz their values. See [Parameter fuzzing](/methodology/web-app/parameter-fuzzing/).
- ☐ **Vhost and subdomain discovery.** Check for public subdomains and for virtual hosts that share an IP address. See [Vhost and subdomain fuzzing](/methodology/web-app/vhost-and-subdomain-fuzzing/).
- ☐ **Input testing, SQL injection.** Confirm the injection by hand, then enumerate with UNION queries or automate with SQLMap. See [SQL injection](/methodology/web-app/sql-injection/), [UNION injection](/methodology/web-app/union-injection/) and [SQLMap](/methodology/web-app/sqlmap/).
- ☐ **Input testing, cross-site scripting.** Identify reflected, stored and DOM-based sinks, then confirm execution in the browser. See [Cross-site scripting](/methodology/web-app/xss/).
- ☐ **Input testing, command injection.** Test inputs that may reach a shell. If the first attempt is blocked, identify what is filtered before attempting evasion. See [Command injection](/methodology/web-app/command-injection/).
- ☐ **Input testing, file inclusion.** Test parameters that select a page or file for local file reads and traversal. See [File inclusion](/methodology/web-app/file-inclusion/).
- ☐ **Input testing, file upload.** Determine what validation exists, where it runs, and whether an uploaded file can be requested and executed. See [File upload attacks](/methodology/web-app/file-upload/).
- ☐ **Authentication.** Identify the login mechanism, test for weak credentials and missing limits, and record the lockout behaviour. See [Login brute forcing](/methodology/web-app/login-brute-forcing/).
- ☐ **Exploitation.** Confirm impact with the least intrusive method that proves it. Stop when the impact is shown, and do not pivot without scope.
- ☐ **Documentation.** Record each request, response, payload and impact, and note the defences that would have prevented the issue. See [Prevention and remediation](/methodology/web-app/prevention/).

## Pages in this section

- [Web proxies](/methodology/web-app/web-proxies/)
- [Content discovery with ffuf](/methodology/web-app/content-discovery-ffuf/)
- [Parameter fuzzing](/methodology/web-app/parameter-fuzzing/)
- [Vhost and subdomain fuzzing](/methodology/web-app/vhost-and-subdomain-fuzzing/)
- [SQL injection](/methodology/web-app/sql-injection/)
- [UNION injection](/methodology/web-app/union-injection/)
- [SQLMap](/methodology/web-app/sqlmap/)
- [Cross-site scripting](/methodology/web-app/xss/)
- [Command injection](/methodology/web-app/command-injection/)
- [File inclusion](/methodology/web-app/file-inclusion/)
- [File upload attacks](/methodology/web-app/file-upload/)
- [Login brute forcing](/methodology/web-app/login-brute-forcing/)
- [Prevention and remediation](/methodology/web-app/prevention/)
