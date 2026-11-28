---
layout: page
title: "Login Brute Forcing"
subtitle: "Testing authentication for weak credentials, missing limits and lockout behaviour"
permalink: /methodology/web-app/login-brute-forcing/
---

Login brute forcing tests whether an authentication mechanism accepts weak credentials and whether it limits repeated attempts. The number of possible passwords is the character set size raised to the password length. A four-digit PIN has 10^4 combinations, which is trivial to try. Eight characters drawn from upper and lower case letters and digits give 62^8, about 2.2 x 10^14, which is only practical when the password follows a predictable pattern. Dictionary and hybrid attacks exploit that pattern.

## Attack types

| Type | Use when |
|---|---|
| Dictionary | Users are likely to choose common words or breached passwords |
| Hybrid | Users apply a policy by changing a known password, such as adding a digit or a year |
| Password spraying | One password is tried against many accounts, which stays below per-account lockout limits |
| Credential stuffing | A set of breached credentials is available and reuse is suspected |

## Workflow

1. Identify the mechanism. Determine whether the target uses HTTP basic authentication (a `401` response with a `WWW-Authenticate` header), a login form that sends a POST request, or a network service such as SSH, FTP or RDP.

2. Record the failure and success behaviour. Submit one invalid login and note the failure text, the status code and any redirect. Test a valid-looking but wrong attempt several times to see whether lockout or rate limiting starts.

3. Build the wordlists.

Usernames from a name, with common formats and substitutions:

```bash
./username-anarchy Jane Smith > jane_smith_usernames.txt
```

Passwords that match a stated policy. For example, a minimum length of 8 with upper case, lower case and a digit:

```bash
grep -E '^.{8,}$' top-passwords.txt > minlength.txt
grep -E '[A-Z]' minlength.txt > uppercase.txt
grep -E '[a-z]' uppercase.txt > lowercase.txt
grep -E '[0-9]' lowercase.txt > policy.txt
```

Tools such as CUPP build a list from personal details gathered from public sources, when the scope allows that research.

4. Attack a login form with Hydra. The condition string names the form fields, and either a failure text (`F=`) or a success condition (`S=`):

```bash
hydra -L usernames.txt -P passwords.txt -f TARGET_IP -s TARGET_PORT http-post-form "/:username=^USER^&password=^PASS^:F=Invalid credentials"
hydra -l admin -P passwords.txt TARGET_DOMAIN http-post-form "/login:user=^USER^&pass=^PASS^:S=302"
```

Use `S=302` when a successful login redirects, and no failure text is shown. Hidden fields and CSRF tokens must be included in the parameter string, with values that are refreshed when they change.

5. Attack HTTP basic authentication:

```bash
hydra -l USERNAME -P passwords.txt TARGET_IP -s TARGET_PORT http-get /
```

6. Attack network services:

```bash
hydra -l USERNAME -P passwords.txt ssh://TARGET_IP
hydra -l USERNAME -P passwords.txt ftp://TARGET_IP
hydra -l administrator -x 6:8:abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 TARGET_IP rdp
```

Medusa is an alternative. It takes `-h` for one host and `-H` for a list, and `-e ns` also tests empty passwords and passwords equal to the username:

```bash
medusa -h TARGET_IP -n TARGET_PORT -u USERNAME -P passwords.txt -M ssh -t 3
medusa -h TARGET_IP -u USERNAME -P passwords.txt -M ftp -t 5
medusa -h TARGET_IP -U usernames.txt -e ns -M ssh
```

| Hydra option | Meaning |
|---|---|
| `-l` / `-L` | One username, or a file of usernames |
| `-p` / `-P` | One password, or a file of passwords |
| `-t` | Parallel tasks |
| `-f` | Stop at the first valid login |
| `-s` | Non-default port |
| `-V` | Show each attempt |

## What to look for

- The success condition. A valid credential must be confirmed by a manual login before it is recorded.
- Lockout messages, CAPTCHAs, `429` responses or temporary bans. Record the threshold and the duration.
- Default or empty credentials on administrative pages and network services.
- Different error messages for unknown usernames and wrong passwords, which allow username enumeration.

## Pitfalls

- A failure string that also appears in the success page makes every attempt look valid. Test a known invalid login first and confirm the match.
- High concurrency triggers lockouts and detection. Use a low `-t` value on live targets.
- `-f` stops at the first hit. Medusa's `-F` stops across all hosts.
- Fixed usernames from a wordlist may not exist on the target. Confirm the account exists before spending the password budget.

> Defense: rate limit and lock accounts after repeated failures, use the same message for every failed login, and require stronger authentication for administrative access. See [Prevention and remediation](/methodology/web-app/prevention/).
{: .info }
