---
layout: page
title: "Password Attack Overview"
subtitle: "How stored passwords are protected, and which cracking approach fits the target"
permalink: /methodology/passwords/password-attack-overview/
---

Passwords are rarely stored in plain text. Systems keep a hash, a fixed-size output produced from the password, and an attacker who obtains the hash can try candidate passwords offline until one produces the same output. This page explains the hashing model, the three main cracking approaches, and how to choose between online attacks against a live service and offline cracking of a captured hash.

## Hashing and salting

A hash function is one-way. Hashing the same input always gives the same output, which allows cracking by comparison:

```bash
echo -n 'EXAMPLE_PASSWORD' | sha256sum
```

To defeat precomputed lookup tables, systems add a random value called a salt to each password before hashing. Two users with the same password then get different hashes, and a rainbow table built without the salt is useless.

## Cracking approaches

| Approach | How it works | When to use it |
|----------|--------------|----------------|
| Rainbow table | Precomputed mapping from hash to input | Only for unsalted hashes of common algorithms |
| Dictionary (wordlist) | Tests each candidate from a list | First choice; fastest route to common passwords |
| Brute force | Tests every combination in a keyspace | Short passwords or constrained patterns |
| Rules and masks | Mutates wordlist entries or fixes character positions | Passwords that follow a policy or a predictable pattern |

Dictionary attacks with good wordlists and rules are the most efficient approach in most engagements. Brute force grows exponentially with length and is used only for short or patterned secrets.

## Workflow

1. Identify the hash type with `hashid -j HASH` or from its format and length.
2. Choose a tool: Hashcat for GPU-accelerated cracking, John the Ripper for format conversion and CPU-based cracking.
3. Start with a wordlist such as rockyou.txt, then add rules.
4. Add targeted candidates from OSINT, such as names, dates and company terms.
5. Apply a mask when the password structure is known.
6. Record every cracked result and confirm it against the authentication service where the scope allows.

> Hash identification is the step most often wrong. A wrong mode produces no result rather than an error, so confirm the format before running long jobs.
{: .tip }

## Online and offline attacks

Online attacks submit guesses to a live service, such as SSH or SMB. They are limited by lockout policies and produce log entries. Offline attacks work on a captured hash and generate no network traffic, so they are not limited by lockouts, but they require the hash in the first place. Prefer offline cracking when the hash is available and keep online attempts to a small, planned set.

## What to look for

- Hashes in configuration, database dumps or registry hives.
- Hash formats that are fast to crack, such as raw MD5 or NT hashes, compared with slow formats such as PBKDF2-based DCC2.
- Password policy details that guide the rule set, such as minimum length and character classes.

## Pitfalls

- Cracking a salted, slow hash with a large rule set can take days. Estimate the time before starting.
- Hash modes and format names differ between tools. Check the tool's own list.
- A cracked password is not the same as a valid credential. Verify it against the service.

> Treat cracked passwords as sensitive data. Store them only in the engagement's approved location and remove them at the end of the engagement.
{: .warning }

## Defense and prevention

Use slow, salted password hashing, long and unique passwords, multi-factor authentication, and monitoring for offline-cracking indicators such as large numbers of hash exports. See the [password prevention](/methodology/passwords/prevention/) page.
