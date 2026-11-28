---
layout: page
title: "Web Proxies"
subtitle: "Intercepting, modifying and replaying HTTP traffic before any other test"
permalink: /methodology/web-app/web-proxies/
---

A web proxy sits between the browser, or a command-line tool, and the target. Every request and response passes through it, so the tester can inspect hidden fields and cookies, edit requests, replay them, and observe how the server reacts. Every other page in this section assumes the proxy is running, because payloads are easiest to craft, verify and reproduce from captured traffic.

## Workflow

1. Start the intercepting proxy (Burp Suite in the examples) and confirm that its listener is active on `127.0.0.1:8080`.
2. Configure the browser to send its traffic to the listener. For HTTPS targets, install the proxy's CA certificate so that the traffic can be read.
3. Define the target as in scope so that unrelated traffic is filtered out of the history.
4. Browse every feature of the application, including registration, login, forms, search and error pages. Each action adds requests to the history.
5. Send interesting requests to Repeater to modify and resend them manually. Use Intruder, or an external fuzzer, when volume is needed.

## Encoding and decoding

Requests must be URL encoded correctly. A request that is not encoded can produce a server error, and that error can look like a finding.

| Character | Why it matters in a URL | Encoded form |
|---|---|---|
| Space | Can end the request data when left raw | `%20` or `+` |
| `&` | Treated as a parameter delimiter | `%26` |
| `#` | Treated as a fragment identifier | `%23` |
| `'` | Common SQL injection character | `%27` |
| `"` | Common quoting character | `%22` |

In Burp, select the text and press Ctrl+U to URL encode it. The Decoder also handles HTML, Unicode, Base64 and ASCII hex.

Cookies and parameters often carry structured values. A cookie that holds a JSON object such as `{"username":"guest", "is_admin":false}` can be decoded, edited (for example, changing the role fields) and re-encoded, then sent in Repeater to test whether the server trusts the client-supplied role.

## Automatic modification

Match and replace rules change every outgoing request that matches. They are useful when a filter blocks a particular User-Agent. Configure them under Proxy settings, HTTP match and replace rules:

| Setting | Value | Purpose |
|---|---|---|
| Type | Request header | The change is in a header, not the body |
| Match | `^User-Agent.*$` | Matches the whole User-Agent line |
| Replace | `User-Agent: TEST_AGENT 1.0` | The replacement line |
| Regex match | True | The match is a pattern, not a literal string |

Disable the rule when the test is finished, so that later traffic is not altered.

## Routing other tools through the proxy

Command-line tools and thick clients often ignore the browser proxy. Route them through proxychains in quiet mode:

```text
# proxychains configuration, ProxyList section
http 127.0.0.1 8080
```

```bash
proxychains -q curl http://TARGET_IP:TARGET_PORT/
```

Metasploit modules take a proxy option in the same form:

```text
set PROXIES HTTP:127.0.0.1:8080
```

## What to look for

- Client-side checks. Validation that happens without any request reaching the server is not a security control. Capture the form submission and replay it directly.
- Hidden fields, cookies and JSON bodies that the application appears to trust.
- Parameters that appear in requests but not in the rendered page.
- Responses that differ from what the browser shows, such as verbose error text.

## Pitfalls

- Match and replace rules left enabled alter all later traffic and cause confusing failures.
- Unencoded characters create server errors that look like vulnerabilities. Confirm with the encoded form before recording a finding.
- Without a scope, the history fills with third-party traffic and the relevant requests are harder to find.
- Command-line tools that bypass the proxy produce no history entries. Check that the tool's traffic is actually captured.

{: .tip }
