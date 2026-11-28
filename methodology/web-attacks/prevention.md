---
layout: page
title: "Web Attacks Prevention"
subtitle: "Consolidated remediation for IDOR, XXE and HTTP verb tampering"
permalink: /methodology/web-attacks/prevention/
---

The three classes in this section are preventable with design decisions rather than signatures or input filtering alone. IDOR requires a server-side access control model. XXE is largely a parser configuration and library maintenance problem. HTTP verb tampering requires consistent authorization across methods and consistent parameter handling. The sections below give the controls for each class, and a short list of checks that a reviewer can use to confirm the fix.

## Insecure direct object references

- **Build object-level access control first.** Use role-based access control, and check on every request whether the authenticated user may access the specific object. A check that only confirms the user is logged in does not prevent IDOR.
- **Derive identity from the session.** Do not accept a role or user identifier from the client, in a cookie, a body field or a hidden form value. Look up the role on the server from the session.
- **Use unpredictable references.** After access control is in place, use random identifiers such as UUID v4 values, mapped to the database object server-side. Do not compute the reference in the browser, and do not use plain hashes of predictable values.
- **Treat unused functions as attack surface.** Remove or protect admin endpoints even when the interface hides them.
- **Log and alert** on repeated access to objects that do not belong to the requester.

## XML external entity injection

- **Keep XML libraries current.** Most XXE is caused by outdated parsers. Include XML processors used by SOAP stacks, document converters and image processors.
- **Disable external entities and DTDs** in the parser configuration. Disable parameter entity processing and XInclude where the application does not need them.
- **Prevent entity reference loops** and limit entity expansion.
- **Do not show parser errors** to users, and implement exception handling that returns a generic message.
- **Prefer JSON** where the application does not need XML, and avoid XML-based APIs such as SOAP unless required.
- **Use a web application firewall** as an additional layer only. It does not replace the parser fix.

## HTTP verb tampering

- **Do not restrict authorization to one verb.** In Apache, use `LimitExcept` rather than `Limit GET`. In Tomcat, use `http-method-omission` rather than naming a single `http-method`. In ASP.NET, use the `add` and `remove` keywords rather than an `allow verbs` entry that covers one verb.
- **Deny unneeded methods.** Disable `HEAD` and `OPTIONS` where the application does not need them, and reject unknown methods at the server.
- **Read the same parameter source in filters and in code.** If the code uses `$_REQUEST`, the filter must also check `$_REQUEST`. Better still, read one defined source and validate it once.
- **Keep method usage consistent.** A given function should use the same method across the application.
- **Test every filter against all methods**, especially those with security roles.

## Verification checklist for a reviewer

| Check | Expected result |
| --- | --- |
| Replay a protected request with each accepted verb | Same authorization result for every verb |
| Change an object identifier with a second account | Access denied on every read and write |
| Submit an XML entity test | Entity is not resolved, and no file contents are returned |
| Trigger a parser error | Generic error with no stack trace or path |
| Send a blocked payload through each method | Blocked consistently, or the parameter is not read from that method |

## Related pages

- [IDOR](/methodology/web-attacks/idor/)
- [XML External Entity Injection (XXE)](/methodology/web-attacks/xxe/)
- [HTTP Verb Tampering](/methodology/web-attacks/http-verb-tampering/)
