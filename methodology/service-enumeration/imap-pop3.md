---
layout: page
title: "IMAP and POP3"
subtitle: "Mailbox access, folder discovery and cleartext credential exposure on mail retrieval ports"
permalink: /methodology/service-enumeration/imap-pop3/
---

## Purpose

IMAP and POP3 let clients retrieve mail from a server. IMAP offers folder synchronisation and server-side mailbox management, while POP3 is limited to listing, retrieving and deleting messages. Both are high-value targets: a valid login exposes correspondence, shared folders and often further credentials. This page covers how to fingerprint both services, test credentials and folder access, and read the configuration that governs them.

## Background

| Protocol | Plain port | TLS port | Notes |
| --- | --- | --- | --- |
| IMAP | 143 | 993 | Access is granted only after successful authentication |
| POP3 | 110 | 995 | Listing, retrieval and deletion only |

Unencrypted IMAP and POP3 send commands, messages and credentials in plain text. Implicit TLS (993 and 995) or STARTTLS on the plain port encrypts the session.

## Enumeration steps

### 1. Fingerprint the services

```bash
sudo nmap -sV -sC -p 110,143,993,995 TARGET_IP
```

Default and NSE scripts report capabilities, banners and certificate details. Treat script output as a lead and verify it manually.

### 2. Inspect the TLS session and certificate

```bash
openssl s_client -connect TARGET_IP:993
openssl s_client -connect TARGET_IP:995
```

The certificate subject and alternative names often reveal the mail hostname and the organisation behind it.

### 3. Test credentials and list folders with curl

```bash
curl -k 'imaps://TARGET_IP' --user USERNAME:PASSWORD
curl -k -v 'imaps://TARGET_IP' --user USERNAME:PASSWORD
```

A successful login returns the folder list. The `-v` option shows the full exchange, including the advertised capabilities.

### 4. Work interactively over IMAP

```text
1 LOGIN USERNAME PASSWORD
1 LIST "" *
1 SELECT "FOLDER_NAME"
1 FETCH 1 (BODY.PEEK[])
1 LOGOUT
```

`LIST "" *` returns every folder, including those that contain no messages (`\Noselect`) and act only as containers. Use `BODY.PEEK[]` rather than `BODY[]` so that fetching a message does not set its read flag.

### 5. Work interactively over POP3

```text
USER USERNAME
PASS PASSWORD
STAT
LIST
RETR 1
CAPA
QUIT
```

`STAT` reports the message count, `LIST` shows sizes, and `RETR` downloads a message by number. Avoid `DELE` unless deletion is explicitly in scope, because it removes messages from the mailbox.

### 6. Review server configuration (with host access)

Dovecot-style settings that increase logging should be checked for password exposure:

| Setting | Risk |
| --- | --- |
| `auth_debug` | Enables all authentication debug logging |
| `auth_debug_passwords` | Writes submitted passwords and the scheme into logs |
| `auth_verbose` | Logs failed attempts and the reason for each failure |
| `auth_verbose_passwords` | Logs authentication passwords, possibly truncated |
| `auth_anonymous_username` | Defines the username used for the ANONYMOUS SASL mechanism |

## What to look for

- Folder names such as admin, shared, development or department folders, which point to additional accounts or data.
- Credentials, tokens or configuration details in message bodies.
- Advertised authentication mechanisms, particularly PLAIN on an unencrypted connection.
- Verbose authentication logs that expose submitted passwords.

> Any credentials recovered through mail should be handled as sensitive and tested only within the agreed scope and lockout limits.
{: .warning }

## Pitfalls

- **`-k` disables certificate verification.** It is common with lab and self-signed certificates, but report that it was used.
- **Read flags change state.** `BODY[]` marks messages as read. Prefer `BODY.PEEK[]` where the mailbox state matters to the client.
- **Destructive commands** such as `DELE`, `CLOSE` (which expunges messages flagged as deleted), `DELETE` and `RENAME` modify the mailbox. Keep to read-only commands during enumeration.
- **Login attempts** are logged and may trigger lockouts. Test a single known credential before any guessing.
- **Plain ports** may refuse login until TLS is negotiated. If a command fails unexpectedly, check whether STARTTLS is required first.

## Defense and prevention

Require TLS on all mail retrieval services and disable the plain-text ports where possible. Offer only strong authentication mechanisms over encrypted sessions, rate-limit and monitor failed logins, and keep authentication debug and password logging disabled outside controlled troubleshooting. Restrict shared and administrative folders to the users who need them.
