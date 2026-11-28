---
layout: page
title: "Parameter Fuzzing"
subtitle: "Finding hidden GET and POST parameters, then fuzzing their values"
permalink: /methodology/web-app/parameter-fuzzing/
---

Parameter fuzzing finds inputs that the application accepts but does not expose in any form. Unpublished parameters are often less tested than the visible ones, so each newly found parameter is a fresh input for the injection and file tests in this section. The method has two stages: find the parameter name, then find a value that returns different content.

## Workflow

1. Start from an endpoint found during content discovery, such as an admin page that refuses access and asks for a key.
2. Fuzz GET parameter names. The value is held at a fixed placeholder (`key` in the examples). Quote the URL so that the shell does not interpret `?` or `&`:

```bash
ffuf -w /opt/useful/seclists/Discovery/Web-Content/burp-parameter-names.txt:FUZZ -u "http://TARGET_URL/admin/admin.php?FUZZ=key" -fs SIZE
```

3. Fuzz POST parameter names. The body goes in `-d`, the method in `-X POST`, and the content type in `-H`:

```bash
ffuf -w /opt/useful/seclists/Discovery/Web-Content/burp-parameter-names.txt:FUZZ -u http://TARGET_URL/admin/admin.php -X POST -d 'FUZZ=key' -H 'Content-Type: application/x-www-form-urlencoded' -fs SIZE
```

4. Confirm a hit by hand. A message that changes for a valid name is the signal:

```bash
curl http://TARGET_URL/admin/admin.php -X POST -d 'id=key' -H 'Content-Type: application/x-www-form-urlencoded'
```

A response such as `Invalid id!` shows that the server processes the `id` parameter, even though the value is wrong.

5. Fuzz values. Build a candidate list when the format is predictable. For numeric IDs from 1 to 1000:

```bash
for i in $(seq 1 1000); do echo $i >> ids.txt; done
```

```bash
ffuf -w ids.txt:FUZZ -u http://TARGET_URL/admin/admin.php -X POST -d 'id=FUZZ' -H 'Content-Type: application/x-www-form-urlencoded' -fs SIZE
```

6. Retest the matching value and record the response that differs from the baseline, such as a different page or data set.

## What to look for

- Responses that change when the parameter name changes, even when the change is only an error message.
- The type of value the parameter expects: numeric, username, file name or free text. The type decides which value wordlist to use.
- Parameters whose names suggest a file, path, page or language. Pass them to the file inclusion tests.
- Parameters that are not linked from any form. These are the highest-value finds, because they are less protected.

## Pitfalls

- A size filter copied from one response can hide real hits. Measure the baseline response for each endpoint.
- A missing or wrong `Content-Type` on a POST can cause the server to ignore the body. The notes point out that PHP accepts form-encoded bodies, so set the header to match.
- A value wordlist that is too narrow misses the correct value. Widen the list before concluding that the parameter is not exploitable.
- Discovered parameters that are not written down are easily lost. Record each name with the endpoint and the response it changed.

{: .tip }
