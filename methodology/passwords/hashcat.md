---
layout: page
title: "Hashcat"
subtitle: "GPU-accelerated offline cracking with attack modes, rules, masks and custom wordlists"
permalink: /methodology/passwords/hashcat/
---

Hashcat cracks password hashes offline, and it uses the GPU for speed, which makes it the preferred tool when a large number of hashes or a fast hash type is involved. Its command structure is the same across hash types: the attack mode (`-a`), the hash mode (`-m`), the hash input and the candidate source. This page covers the attack modes, the mask syntax, and a workflow for building a targeted wordlist from known personal information.

## Basic syntax

```bash
hashcat -a 0 -m 0 HASH_FILE WORDLIST
hashcat -a 0 -m 0 HASH_FILE WORDLIST -r /usr/share/hashcat/rules/best64.rule
hashcat -a 3 -m 0 HASH '?u?l?l?l?l?d?s'
```

`-a` selects the attack mode and `-m` the hash type. Use `--show` to list cracked results for a hash file without rerunning the job.

## Hash modes used in these notes

| Mode | Hash type | Notes |
|------|-----------|-------|
| 0 | MD5 | Raw unsalted MD5 |
| 1000 | NT | Windows NT hash from SAM, NTDS.dit or LSASS |
| 1800 | sha512crypt | Linux `/etc/shadow` format with `$6$` |
| 2100 | DCC2 | Cached domain credentials, PBKDF2-based and slow |
| 5600 | NetNTLMv2 | Captured by Responder or relay tools |
| 22100 | BitLocker | Extracted by bitlocker2john |

## Attack modes

1. Dictionary attack (`-a 0`) tests each word in the list. Add rules with `-r` to mutate every word, for example with the `best64.rule` file in the Hashcat rules directory.
2. Mask attack (`-a 3`) defines the keyspace explicitly. A password that begins with an uppercase letter, followed by four lowercase letters, a digit and a symbol uses `?u?l?l?l?l?d?s`.

| Symbol | Character set |
|--------|---------------|
| `?l` | lowercase letters |
| `?u` | uppercase letters |
| `?d` | digits |
| `?h` | lowercase hexadecimal |
| `?H` | uppercase hexadecimal |
| `?s` | special characters and space |
| `?a` | all of `?l?u?d?s` |
| `?b` | all bytes, 0x00 to 0xff |

## Building a targeted wordlist

Policies and personal information shape the likely passwords. Start with common structures such as capitalisation, appended digits, years, months and a final symbol. Then combine them with names and terms gathered from OSINT.

```text
Name1998!
Pet0805!
Company08051998!
```

Save the base list, write a rules file that applies the mutations, and generate the expanded list:

```text
:
c
so0
$!
c $!
```

```bash
hashcat --force base.list -r custom.rule --stdout | sort -u > mutated.list
awk 'length($0) >= 12' mutated.list > mutated_12.list
hashcat -a 0 -m 0 HASH mutated_12.list
```

In this rules syntax, `c` capitalises the first letter, `so0` replaces `o` with `0`, and `$!` appends an exclamation mark. The `awk` filter keeps only candidates that meet a 12-character minimum policy.

## Generating candidates from a page

CeWL spiders a web page and builds a wordlist from its text. It is useful when the target's website contains names, products or terms.

```bash
cewl -d 1 -m 2 --with-numbers -w WORDLIST_OUT.txt http://LOCALHOST:8000/PAGE.html
```

`-d 1` limits the spider depth, `-m 2` keeps words of at least two characters, and `--with-numbers` retains numeric tokens such as years. The output feeds the same rule workflow as the custom list.

> Keep rule sets small at first. Each added rule multiplies the candidate count, and a large rule set can make a job run for days.
{: .tip }

## What to look for

- A cracked hash with its plaintext in the `--show` output, which is the confirmed credential.
- A hash that remains uncracked after the wordlist and rules, which suggests a different mode or a stronger password.
- Passwords that contain company names, years or pet names, which suggest a pattern for further lists.

## Pitfalls

- The wrong `-m` value produces no result. Confirm the mode against the table before running.
- The `--force` flag suppresses warnings. Use it only to generate candidates and do not rely on it for cracking runs.
- Hashcat writes a potfile that stores results. Clear it when testing ends if the engagement requires.

> Store cracked credentials in the engagement's approved location only.
{: .info }

## Defense and prevention

Use long passwords that do not follow predictable policy patterns, a slow password hashing function, and a password blocklist that rejects common mutations. See the [password prevention](/methodology/passwords/prevention/) page.
