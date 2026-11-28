---
layout: page
title: "Insecure Direct Object References (IDOR)"
subtitle: "Finding and exploiting object references, from URL parameters to insecure API calls"
permalink: /methodology/web-attacks/idor/
---

An insecure direct object reference (IDOR) occurs when the application exposes an identifier for a record, file or function and does not check, on the server, that the requester is allowed to use it. The vulnerability is an access control failure. The reference itself, whether it is a sequential number, an encoded value or a hash, is only the way the flaw is reached. The goal of testing is to show that one user can read or change another user's object, or call a function that belongs to a different role.

## Workflow

1. **Inventory object references.** Review every request for values that point to a resource: `uid=`, `filename=`, `contract=`, JSON fields such as `"uid"`, and path segments such as `/api/profile/1`. Cookies that carry a role or user identifier count too.
2. **Test the simple case.** Change the value to a neighbouring one while keeping your own session. Compare the status code, length and content with the baseline.

```http
GET /documents.php?uid=2 HTTP/1.1
Host: TARGET_URL
Cookie: PHPSESSID=SESSION_ID
```

3. **Read the client-side code.** Search the page's JavaScript for `ajax`, `$.post`, `fetch` and `XMLHttpRequest`. Functions that a non-admin user never calls, such as an admin password change, may still be reachable with a crafted request.
4. **Decode or reproduce any encoding.** If a reference is Base64, decode it, change the underlying value and encode it again. If it is a hash, read the script that computes it before attempting to guess the input. Use `-n` and `-w 0` so no newline is hashed.

```bash
$ echo -n 1 | base64 -w 0 | md5sum
```

5. **Compare two accounts.** Register a second user, record each request for both accounts, and replay the first user's requests using the second user's session. A successful replay is an IDOR even if the attacker cannot yet predict the other identifiers.
6. **Test functions as well as reads.** Repeat each object-bearing call with `GET` for disclosure and with `PUT`, `POST` or `DELETE` for actions. A read endpoint may be protected while a write endpoint is not.
7. **Automate enumeration.** Once the pattern is known, script it. Keep the request rate low and only enumerate what the rules of engagement allow.

```bash
#!/bin/bash
url="http://TARGET_URL"
for i in {1..10}; do
  for link in $(curl -s "$url/documents.php?uid=$i" | grep -oP "\/documents.*?.pdf"); do
    wget -q "$url$link"
  done
done
```

## What to look for

| Observation | Likely finding |
| --- | --- |
| Changing the ID returns another user's data | Information disclosure through IDOR |
| A write call accepts another user's ID | Insecure function call, with the ability to change other users |
| Reference is hashed in the browser | Reproducible if the hashed input is visible in the JavaScript |
| Role is in a cookie or request body | Client-controlled authorization, worth testing with a higher role |
| Error mentions a mismatch (for example, a UUID check) | Control exists on this path; test the GET and the other methods |

## Chaining and escalation

Information leaked by a read endpoint can unlock a write endpoint. In one tested pattern, a GET request revealed an administrator's role name, and that role name was then accepted in the update request for the attacker's own account. The impact of this is account takeover or privilege escalation. Document the chain step by step, and do not go further than the rules of engagement allow.

## Pitfalls

> Changing another user's record is a real change to production data. Use test accounts where possible, record the original values, and restore them after testing.
{: .warning }

- A rejected request does not prove the absence of IDOR. Test each method and each parameter separately, because a check may protect only one path.
- Unique identifiers such as UUIDs make enumeration harder but do not fix broken access control. If the control is missing, a second user's session is enough.
- Client-side hashing hides a value only until the script is read. Always inspect the code that produces the reference.

## Defense

The fix is an object-level access control check on every request, performed on the server against the authenticated session. Identifiers should be unpredictable and mapped to objects in the database, not computed in the browser. See [Web Attacks Prevention](/methodology/web-attacks/prevention/) for the full set of controls.
