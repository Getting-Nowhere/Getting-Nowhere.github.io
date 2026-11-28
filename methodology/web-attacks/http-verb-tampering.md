---
layout: page
title: "HTTP Verb Tampering"
subtitle: "Testing alternate HTTP methods against access controls and input filters"
permalink: /methodology/web-attacks/http-verb-tampering/
---

HTTP verb tampering exploits a mismatch between how a control is written and the full set of methods the server accepts. There are two common causes. In an insecure configuration, an authentication rule names only some methods, such as `GET`, and every other method passes through. In insecure coding, a security filter inspects one source of parameters, such as `POST` data, while the application reads from a source that includes others, such as `$_REQUEST`. Both are tested by changing the method and comparing the result.

## Workflow

1. **Identify the protected function.** Find the page or action that is restricted. A `401` prompt or a redirect to a login-protected path such as `/admin/` marks the control boundary. Confirm which path is protected and which is not.
2. **Note the method in use.** Capture the request in an intercepting proxy and record the verb. Then send the same request with the other common verbs, including `POST`, `HEAD` and `PUT`, and record each status code.
3. **Enumerate accepted methods.** An `OPTIONS` request often lists the methods the server allows in the `Allow` header.

```bash
$ curl -i -X OPTIONS http://TARGET_URL/
```

The `Allow` header in the response, for example `Allow: POST,OPTIONS,HEAD,GET`, shows what to test next.

4. **Replay with alternate verbs.** Send the protected action with each method that did not produce a `401`.

```bash
$ curl -i -X HEAD http://TARGET_URL/admin/reset.php
```

5. **Check for inconsistent parameter handling.** Send a payload that a filter blocks in one method and move the same parameter to another method. The filter may check only the body, while the application reads the query string.

```http
GET /create.php?filename=file1;%20touch%20file2; HTTP/1.1
Host: TARGET_URL
```

6. **Confirm impact without damage.** Prove execution with a benign side effect, such as creating a file with a known name, then remove it.

## Decision points

| Result | Next step |
| --- | --- |
| `401` on `GET`, `200` on `HEAD` or `OPTIONS` | Authentication is bypassed on that verb. Confirm the action happened. |
| Filter blocks in `POST` but not in `GET` | Inconsistent filtering. Test the injection through the unfiltered method. |
| `405 Method Not Allowed` | The method is rejected. Try the next verb. |
| Same response for every method | No inconsistency at this layer. Check other inputs. |

## Pitfalls

- `HEAD` returns the same headers as `GET` with no body. A blank body does not mean failure. Verify the effect, for example by checking whether a list of files changed.
- `PUT` and `DELETE` change data on the server. Only test them against objects you are authorised to change, and only after confirming the rules of engagement.
- A payload that works through one method may be rejected by a second, separate filter. Test each stage of the request path.

> The example that is most often seen in practice is a file manager that requires login for `GET` and `POST`, but processes a `HEAD` request for the same delete action with no check. Always test the full set of methods, not just the ones the browser uses.
{: .info }

## Defense

Apply authorization to all methods rather than to a single verb, and make filters read the same parameter source as the code that uses the value. See [Web Attacks Prevention](/methodology/web-attacks/prevention/).
