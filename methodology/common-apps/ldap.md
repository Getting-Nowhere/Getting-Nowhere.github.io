---
layout: page
title: "LDAP"
subtitle: "Directory protocol basics, ldapsearch queries, and LDAP injection through login forms"
permalink: /methodology/common-apps/ldap/
---

LDAP, the Lightweight Directory Access Protocol, is the standard way to read and modify directory data such as users, groups, computers and printers. Web applications and network devices use it for central authentication, so an LDAP service is often the backend behind a login page. This page covers how to query an LDAP service, how to recognise it during discovery, and how a login form that builds LDAP filters from raw input can be bypassed.

## Discovery

A full port scan with version detection identifies LDAP on TCP 389 (cleartext) or 636 (LDAPS), and often shows a web login on the same host:

```bash
nmap -p- -sC -sV --open --min-rate=1000 TARGET_IP
```

If a web application and an LDAP service run on the same host, assume the web application authenticates against LDAP and test it for injection.

## Querying with ldapsearch

`ldapsearch` sends a bind, a search base and a filter to the server. When credentials are available, bind as that account:

```bash
ldapsearch -H ldap://TARGET_IP:389 -D "cn=USERNAME,dc=DOMAIN_LABEL,dc=local" -w PASSWORD -b "ou=people,dc=DOMAIN_LABEL,dc=local" "(mail=USER@DOMAIN_LABEL.local)"
```

| Part | Meaning |
|------|---------|
| `-H` | Server URI and port |
| `-D` | Distinguished name used to bind |
| `-w` | Bind password |
| `-b` | Base DN, where the search starts |
| Filter | Condition in parentheses, such as `(mail=...)` |

The response lists each matching entry's `dn:` and its attributes. Look for `userPassword`, `description`, group membership and service account names.

## LDAP and Active Directory

| LDAP | Active Directory |
|------|------------------|
| A protocol for accessing directory data | A directory server that speaks LDAP among other protocols |
| Works with many server types | Built for Windows networks |
| Flexible schema | Predefined schema with Windows-specific classes |
| Simple bind, SASL and other mechanisms | Kerberos as the primary mechanism, with NTLM and LDAP over TLS |

## LDAP injection

LDAP injection is the directory equivalent of SQL injection. When user input is concatenated into a filter, special characters change its logic. The useful characters are:

| Input | Effect |
|-------|--------|
| `*` | Matches any value |
| `( )` | Groups expressions |
| `\|` | Logical OR |
| `&` | Logical AND |
| `(cn=*)` or `(objectClass=*)` | A condition that is always true |

A login filter built from raw input looks like this:

```text
(&(objectClass=user)(sAMAccountName=USERNAME_INPUT)(userPassword=PASSWORD_INPUT))
```

Injecting `*` into the username makes the name condition match every account, so the password condition alone decides the result. Injecting `*` into the password makes the password condition match any value. Test both fields, and test with the wildcard in each field separately.

### Testing procedure

1. Submit a single quote or a parenthesis first, and look for a filter error in the response.
2. Submit `*` in the username with a known or dummy password, and observe the result.
3. Submit `*` in the password with a known username.
4. Submit `*` in both fields.
5. Record each request and response that changed the outcome.

> A successful wildcard login proves the authentication logic is flawed. Log in only to the extent needed to show impact, and do not change or delete directory data.
{: .warning }

## What to look for

- A login that accepts `*` in either field.
- Filter errors that echo the query or the LDAP error text.
- Anonymous binds that return the directory tree.
- Service accounts with passwords stored in plaintext attributes such as `description`.

## Pitfalls

- A wildcard login can fail on applications that escape input correctly. A failed test does not prove the absence of injection.
- LDAP over plain TCP 389 exposes bind credentials on the wire. Note this as a finding when credentials are captured.

## Defense and prevention

Validate user input and escape LDAP special characters before they reach a filter. Use parameterised or framework-provided LDAP query functions, so input is treated as data. Require LDAPS or StartTLS for every bind. Bind with a least-privilege service account, and disable anonymous binds that expose the directory. For Active Directory integration of web applications, see the [application hardening](/methodology/common-apps/prevention/) page.
