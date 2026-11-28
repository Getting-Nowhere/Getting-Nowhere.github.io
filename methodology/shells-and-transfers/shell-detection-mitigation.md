---
layout: page
title: "Shell Detection and Mitigation"
subtitle: "How defenders detect reverse shells, web shells and transfers, and the controls that reduce them"
permalink: /methodology/shells-and-transfers/shell-detection-mitigation/
---

**Purpose:** understand the detection methods that will see shell and transfer activity, so that the tester can document how each one was tested and so that the report can recommend effective controls. This page is written from the defender's side.

Coverage here draws on the detection points raised in the related shell, Metasploit and transfer notes.

## Detection methods

| Method | How it works | What it sees in shell activity |
|---|---|---|
| Signature-based detection | Compares traffic and files to known attack patterns, and alerts on a full match | Known payload bytes, known download commands, known web shell content |
| Heuristic or statistical anomaly detection | Compares behaviour to a baseline of normal traffic and alerts on deviations | Unusual outbound connections, odd protocol use, new sessions from servers |
| Stateful protocol analysis | Checks that protocol sessions follow the expected sequence | Traffic that uses a protocol in a way normal clients would not |
| Live monitoring and alerting (SOC) | Analysts watch feeds and alerts, and decide or automate a response | Anything the above methods raise, plus correlation across hosts |

Firewalls with deep packet inspection and Layer 7 visibility can block a reverse shell even on a permitted port. Some inspection devices terminate and re-inspect TLS, which makes encrypted transfers visible to the inspection layer.

## Host-level detection points

- **Interpreters that open sockets.** A shell spawned by an interpreter such as bash, Python or PowerShell, with a network connection attached, is a strong signal.
- **Windows Defender and other endpoint protection.** These can stop a payload or script before it runs. Tampering with them is itself a high-value signal.
- **Built-in binaries making network calls.** `certutil`, `bitsadmin` and `certreq` connecting to external hosts are common alerts in many environments.
- **New listeners.** A server that opens a listening port it did not previously use is suspicious, especially in the high range.
- **Web server file writes.** A new script written to an upload directory, followed by a request to that file, matches web shell deployment.

## Mitigations by layer

### Network

- Restrict egress from servers to the destinations and ports they need. A server that cannot reach the internet cannot call back.
- Block unneeded inbound ports and protocols. Blocking SMB (445) between workstations and WinRM where it is not required reduces transfer options.
- Inspect and alert on unusual use of common ports such as 443, including traffic that does not match the expected protocol.
- Monitor DNS for unusually long or high-volume queries, which is a common sign of DNS tunnelling.

### Host

- Keep endpoint protection running with real-time monitoring, and alert when it is disabled.
- Enable PowerShell script block logging and constrained language mode where practical.
- Restrict which users can run `certutil`, `bitsadmin` and `certreq` through application control.
- Remove interpreters that a server does not need.

### Web application

- Validate uploads by extension, by content detected from the file, and by size. Do not trust the client-supplied `Content-Type`.
- Store uploads outside the web root, or in directories where the script engine does not run.
- Restrict the web-server account to write access only where uploads are expected.

## What to look for when testing

- Whether a reverse shell callback was blocked, and by which layer
- Whether the defender's alert fired, and how long the alert took
- Whether the detection was a signature match or a behavioural alert, since the two need different remediation

## Reporting

Record each technique, the payload or command used, the detection outcome and the control that stopped or failed to stop it. Recommendations should name the specific layer and setting, not a general "improve monitoring" statement.

> Blocking one protocol rarely removes the option. Test the set of egress and inbound paths as a whole and report the combination that remains open.
{: .tip }
