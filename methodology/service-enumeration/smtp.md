---
layout: page
title: "SMTP"
subtitle: "Mail server fingerprinting, user verification and open relay checks on ports 25 and 587"
permalink: /methodology/service-enumeration/smtp/
---

## Purpose

The Simple Mail Transfer Protocol (SMTP) moves email between servers and from clients to their outgoing mail server. SMTP servers can reveal their software, valid mailbox names and, if misconfigured, whether they will relay mail for anyone. This page covers how to fingerprint an SMTP server, test user verification commands, check relay behaviour and review the configuration that controls each of these.

## Background

Mail moves through several agents:

- The **Mail User Agent (MUA)** is the client that composes the message and sends it to the server.
- The **Mail Submission Agent (MSA)** checks that the sender is allowed to submit mail. It is also called the relay server, which is why misconfigured submission is so significant.
- The **Mail Transfer Agent (MTA)** receives mail and routes it onward.
- The **Mail Delivery Agent (MDA)** places the message in the recipient's mailbox.

Port 25 carries server-to-server traffic. Port 587 is the submission port, and STARTTLS upgrades a plain connection to TLS. Most modern servers advertise ESMTP extensions in response to `EHLO`.

## Enumeration steps

### 1. Fingerprint the server

```bash
sudo nmap TARGET_IP -sV -sC -p25,587
```

Default scripts report the banner, supported extensions and STARTTLS status. Run additional SMTP scripts only where the scope allows.

### 2. Connect and read the banner

```bash
telnet TARGET_IP 25
```

The `220` banner identifies the server. Continue with the greeting:

```text
EHLO DOMAIN
```

Use `EHLO` rather than `HELO` to see the ESMTP extensions, such as PIPELINING, SIZE, STARTTLS, AUTH and CHUNKING.

### 3. Test user verification

```text
VRFY USERNAME
EXPN LISTNAME
```

`VRFY` asks whether a mailbox exists. Typical responses are `250` (exists), `252` (the server cannot verify the user but will attempt delivery) and `550` (no such user). `EXPN` expands a mailing list. Servers that disable these commands return an error, which is itself a finding.

### 4. Check relay behaviour

```text
MAIL FROM: <SENDER@DOMAIN>
RCPT TO: <RECIPIENT@EXTERNAL_DOMAIN>
QUIT
```

Stop after the `RCPT TO` response and send `QUIT` without issuing `DATA`. A `250` accepting an external recipient from an external sender suggests an open relay. Confirm the result without delivering any message, and only against addresses in scope.

### 5. Review configuration (with host access)

```bash
cat /etc/postfix/main.cf | grep -v "#" | sed -r "/^\s*$/d"
```

Note the server name, `mynetworks`, `mydestination`, `smtpd_helo_restrictions`, the alias maps and the mailbox location.

## What to look for

| Setting | Risk |
| --- | --- |
| `mynetworks = 0.0.0.0/0` | Relays mail for any client on the internet (open relay) |
| `VRFY` or `EXPN` enabled | Confirms valid mailboxes and list membership |
| `smtpd_helo_restrictions` weak or absent | Accepts malformed or spoofed greeting names |
| `smtpd_banner` with full version | Discloses software version for targeted attacks |
| `home_mailbox` pointing to a shared path | Mailbox files readable through other services |

- Mail hostnames in the MX records from the DNS checks, and whether they match the banner.
- Submission ports that accept AUTH without TLS.
- Internal hostnames or addresses in banners and headers.

> A confirmed open relay can be abused to send unsolicited or spoofed mail under the organisation's name. Stop testing at the first confirmation and report it.
{: .danger }

## Pitfalls

- **252 is not proof.** It means the server will attempt delivery without confirming the mailbox, so do not treat it as a valid account.
- **Many servers disable VRFY and EXPN** by design. A refusal is a normal result.
- **Relay tests can generate mail.** Always stop before `DATA` and confirm that no message is queued.
- **Telnet is cleartext.** Use TLS where the server requires STARTTLS, and record that the session was unencrypted.
- **Port 25 may be blocked** by the client network or ISP, so a timeout does not show that the service is absent.

## Defense and prevention

Restrict `mynetworks` to internal ranges, require SASL authentication with TLS on the submission port, and disable `VRFY` and `EXPN` or make them return generic responses. Reject invalid HELO names, suppress detailed version information in the banner, and publish SPF, DKIM and DMARC records so that spoofed mail is easier to detect. Monitor outbound volume for signs of relay abuse.
