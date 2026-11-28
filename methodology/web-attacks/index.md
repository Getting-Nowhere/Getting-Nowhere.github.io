---
layout: page
title: "Web Attacks"
subtitle: "Testing workflow for IDOR, XXE and HTTP verb tampering, with prevention guidance"
permalink: /methodology/web-attacks/
---

This section covers three vulnerability classes that share a common root cause: the server trusts something it should verify. Insecure direct object references trust a client-supplied identifier, XML external entity injection trusts a document's declared structure, and HTTP verb tampering trusts that a control applies to every method. Testing these classes is mostly careful comparison. Capture the normal request, change one thing at a time, and compare the response with a baseline from a second account or a second method. Each page below gives a repeatable workflow, the decision points that determine the next step, and the defensive fix that closes the class.

## Checklist

- ☐ Map every request that carries an object reference, a file name, an XML body or an HTTP method that changes server behaviour.
- ☐ Test object references with two accounts and compare responses. Check both read and write endpoints.
- ☐ Review client-side JavaScript for hidden functions, AJAX calls and client-side hashing or encoding.
- ☐ Identify every XML input, including SOAP, XML uploads and document formats that wrap XML, and test for entity processing.
- ☐ Choose the XXE output channel (reflected, error-based or out of band) from the observed behaviour.
- ☐ Replay each protected request with alternate HTTP methods, including HEAD, OPTIONS and POST.
- ☐ Test the same input through every method the application accepts, because filters often cover only one.
- ☐ Confirm each finding with a harmless, reversible proof of impact, and record the exact request and response.
- ☐ Check the prevention points for each class before writing the recommendation in the report.

## Pages in this section

- [IDOR](/methodology/web-attacks/idor/)
- [XML External Entity Injection (XXE)](/methodology/web-attacks/xxe/)
- [HTTP Verb Tampering](/methodology/web-attacks/http-verb-tampering/)
- [Web Attacks Prevention](/methodology/web-attacks/prevention/)
