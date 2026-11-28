---
layout: page
title: "Target User Lists and Password Policies"
subtitle: "Build a valid username list and read the lockout rules before any password attempt"
permalink: /methodology/active-directory/target-user-lists-and-policies/
---

A password attack needs two inputs: a list of real usernames and the password policy. Without a valid list you are guessing names, and without the policy you cannot tell how many attempts are safe before an account locks. Collect both before you spray anything. This page covers the methods the notes describe for building a user list and reading the policy, from unauthenticated to credentialed.

## Workflow

1. Try unauthenticated user enumeration: SMB null session, anonymous LDAP, and Kerberos pre-authentication checks.
2. If you have any domain credential, pull the full user list with it.
3. Build the list from OSINT if the methods above return nothing.
4. Read the password policy from the same sources.
5. Remove accounts that are close to the lockout threshold, and record the list.

## Step 1: Build the username list

### SMB null session

An SMB null session can return the full user list from a DC when it allows anonymous access. Tools include `enum4linux`, `rpcclient`, and CrackMapExec.

```bash
enum4linux -U DC_IP | grep "user:" | cut -f2 -d"[" | cut -f1 -d"]"
rpcclient -U "" -N DC_IP
rpcclient $> enumdomusers
```

### LDAP anonymous bind

Some domains allow anonymous LDAP queries, which can list users, groups, and computers.

```bash
ldapsearch -h DC_IP -x -b "BASE_DN" -s sub "(&(objectclass=user))" | grep sAMAccountName: | cut -f2 -d" "
windapsearch.py --dc-ip DC_IP -u "" -U
```

### Kerberos pre-authentication

`kerbrute userenum` sends Kerberos requests without pre-authentication. When the KDC asks for pre-authentication, the username exists. This method does not generate the `4625` failed-logon events that SMB or LDAP attempts create, which makes it quieter.

```bash
kerbrute userenum -d DOMAIN --dc DC_IP USERLIST.txt
```

### Credentialed collection

With any valid domain account, CrackMapExec can enumerate users and show `badpwdcount` and `badpwdtime`. Use the counts to drop accounts that are near the lockout threshold.

```bash
crackmapexec smb DC_IP -u USERNAME -p PASSWORD --users
```

### OSINT

If the methods above fail, build a candidate list from staff names and common username formats, such as statistically likely username lists or a LinkedIn scraper. Expect many of these names to be wrong, so verify with Kerberos pre-authentication before spraying.

## Step 2: Read the password policy

```bash
crackmapexec smb DC_IP -u USERNAME -p PASSWORD --pass-pol
rpcclient -U "" -N DC_IP   # then: getdompwinfo
ldapsearch -H ldap://DC_IP -x -b "BASE_DN" -s sub "*" | grep -m 1 -B 10 pwdHistoryLength
```

From a domain-joined Windows host:

```cmd
net accounts
```

```powershell
Import-Module .\PowerView.ps1
Get-DomainPolicy
```

The output shows minimum length, history size, complexity, lockout threshold, lockout duration, and the observation window.

### What the values mean

| Setting | Example | Why it matters |
|---|---|---|
| Lockout threshold | 5 | Number of bad attempts before lock |
| Observation window | 30 minutes | Period over which bad attempts are counted |
| Lockout duration | 30 minutes | How long the account stays locked |
| Minimum length | 8 | Shapes candidate passwords |
| Complexity | Enabled | Requires three of four character classes |
| History | 24 | Prevents reuse of recent passwords |

Default domain values, before an administrator changes them, are different. They include a minimum length of 7, a lockout threshold of 0 (no lockout), and lockout duration and reset counter not set.

## What to look for

- A lockout threshold of 0 or a high number, which allows more attempts
- A short observation window, which allows more attempts per hour
- Accounts with `badpwdcount` close to the threshold
- Null session or anonymous LDAP access that returns the full user list

## Pitfalls

- Complexity does not stop weak passwords. `Password1` and `Welcome1` meet the rule and are still in every spray list.
- Accounts that are already locked, disabled, or near threshold can lock out when you test them. Remove them from the list.
- A negative result from anonymous access does not prove there are no users. Many modern domains block anonymous queries.

## Defense

- Disable anonymous LDAP binds and restrict SMB null sessions where they are not needed.
- Set a lockout threshold that is high enough to resist accidental lockouts but low enough to slow spraying, and set an observation window that matches the threshold.
- Set a minimum length of 10 to 14 characters, since 8 characters is common but weak.
- Monitor failed logons (`4625`) and Kerberos pre-authentication failures (`4771`) over short periods.
