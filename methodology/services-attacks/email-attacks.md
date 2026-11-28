---
layout: page
title: "Email Attacks"
subtitle: "Mail server discovery, username enumeration, spraying and open relay testing"
permalink: /methodology/services-attacks/email-attacks/
---

Email services move messages with SMTP and retrieve them with POP3 or IMAP. Mail servers are attractive targets because they reveal valid usernames, accept authentication from many clients, and sometimes relay mail for anyone. This page covers how to find the mail infrastructure, enumerate valid recipients, test authentication, and check whether the server acts as an open relay.

## Workflow

1. Find mail exchangers (MX records) for the domain and identify the mail platform.
2. Scan the mail ports and run default Nmap scripts.
3. Enumerate valid usernames with SMTP commands or cloud validation tools.
4. Spray a single password across validated accounts, respecting lockout limits.
5. Test whether the SMTP server relays mail for unauthenticated senders.

## Ports

| Port | Service | Notes |
|------|---------|-------|
| TCP 25 | SMTP | Unencrypted server-to-server and client submission |
| TCP 587 | SMTP submission | Encrypted with STARTTLS |
| TCP 465 | SMTP | Encrypted (SMTPS) |
| TCP 110 | POP3 | Unencrypted |
| TCP 995 | POP3 | Encrypted |
| TCP 143 | IMAP4 | Unencrypted |
| TCP 993 | IMAP4 | Encrypted |

## Discovery

```bash
host -t MX DOMAIN
dig mx DOMAIN | grep "MX" | grep -v ";"
sudo nmap TARGET_IP -sV -sC -p25,110,143,465,587,993,995
```

The MX answer shows whether mail is hosted by a third party such as a cloud provider. Hosted mail changes the scope: spraying cloud accounts may be out of scope and needs explicit authorization.

## Username enumeration

SMTP offers three commands that reveal users:

```text
VRFY root
EXPN support-team
RCPT TO:<USERNAME@DOMAIN>
```

`VRFY` checks whether a mailbox exists, `EXPN` expands a distribution list into its members, and `RCPT TO` reports whether a recipient is accepted during a delivery transaction. Automate the last method with `smtp-user-enum`:

```bash
smtp-user-enum -M RCPT -U userlist.txt -D DOMAIN -t TARGET_IP
```

The `-D` option supplies the domain when the server expects full addresses. POP3's `USER` command can also be used to test usernames.

For Microsoft 365 targets, the O365 Spray tool validates and enumerates accounts:

```bash
python3 o365spray.py --validate --domain DOMAIN
python3 o365spray.py --enum -U users.txt --domain DOMAIN
```

## Password attacks

```bash
hydra -L users.txt -p 'PASSWORD' -f TARGET_IP pop3
python3 o365spray.py --spray -U usersfound.txt -p 'PASSWORD' --count 1 --lockout 1 --domain DOMAIN
```

The O365 Spray example uses a single attempt per account with a one-minute lockout window to stay under the threshold. Mirror that approach against any mail service: one password, a long interval, and the lockout policy confirmed beforehand.

## Open relay

An open relay accepts mail from unauthenticated senders and forwards it to other domains. Nmap's `smtp-open-relay` script can test a server:

```bash
nmap -p25 --script smtp-open-relay TARGET_IP
```

A relay can be used to send mail that appears to come from a trusted address. The check itself should use a test message to an address the client controls.

> Sending phishing or spoofed messages through an open relay is outside a normal assessment. Test relay behaviour with a benign message to an approved address, record the result, and report it.
{: .warning }

## What to look for

- `VRFY`, `EXPN` or `RCPT TO` answering differently for valid and invalid users.
- Enumerable distribution lists exposed through `EXPN`.
- Spray results from POP3 or IMAP that return a valid login.
- A relay that accepts mail for an external domain with no authentication.

## Pitfalls

- Some servers return a generic answer for every address, which hides valid users. Test a known-invalid name first.
- Cloud mail platforms apply their own lockout and throttling. Read the vendor's limits.
- Brute forcing POP3 or IMAP for one account can lock the mailbox for the user.

## Defense and prevention

Disable `VRFY` and `EXPN`, return uniform responses for unknown recipients, require authentication for submission, close the relay, enforce multi-factor authentication on mailboxes, and monitor for password spraying patterns. See the [services prevention](/methodology/services-attacks/prevention/) page.
