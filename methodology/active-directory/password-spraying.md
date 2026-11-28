---
layout: page
title: "Password Spraying"
subtitle: "Test one password against many accounts while staying under the lockout threshold"
permalink: /methodology/active-directory/password-spraying/
---

Password spraying tries one password, or a short list of common passwords, against many accounts, then waits before trying the next password. Because each account sees only one or two attempts per window, the attack rarely triggers lockout, and it works well against the weak passwords that most organizations still allow. A valid result gives you the first credential for the assessment. Do not start until you have a validated user list and the lockout policy (see [Target User Lists and Password Policies](/methodology/active-directory/target-user-lists-and-policies/)).

## Workflow

1. Confirm the user list and the policy, and calculate the number of attempts per observation window.
2. Choose one or two passwords to try, such as a season and year, or a company name with a common suffix.
3. Run the spray once, record every result, and then wait out the observation window.
4. Validate each hit with a single authentication attempt.
5. Stop and reassess if any account locks.

## Step 1: Spray from Linux

Using `rpcclient`, a successful login prints an `Authority Name` line. Filter for that line to find accounts that authenticated.

```bash
for u in $(cat valid_users.txt); do rpcclient -U "$u%PASSWORD" -c "getusername;quit" DC_IP | grep Authority; done
```

Using `kerbrute`, which uses Kerberos pre-authentication and is faster:

```bash
kerbrute passwordspray -d DOMAIN --dc DC_IP valid_users.txt PASSWORD
```

Using CrackMapExec:

```bash
sudo crackmapexec smb DC_IP -u valid_users.txt -p PASSWORD | grep +
```

## Step 2: Spray from Windows

When you are authenticated to the domain, `DomainPasswordSpray` builds the user list from AD, reads the policy, and skips accounts that are one attempt away from lockout.

```powershell
Import-Module .\DomainPasswordSpray.ps1
Invoke-DomainPasswordSpray -Password PASSWORD -OutFile spray_success -ErrorAction SilentlyContinue
```

## Local administrator password reuse

If you have the NT hash of a local administrator account, the same hash may work on other machines that were built from the same image. Test it with `--local-auth`, which makes one login attempt per host and avoids domain lockout.

```bash
sudo crackmapexec smb --local-auth TARGET_SUBNET -u administrator -H NTLM_HASH | grep +
```

SQL and Exchange servers are high-value targets for this check, because privileged users often log on to them.

## What to look for

- Accounts that authenticate with the sprayed password
- Accounts with an old `badpwdtime` or a low `badpwdcount`, which are safer to include
- Services that accept any domain user, which increases the value of a single hit
- Local admin hashes that are reused across a subnet

## Pitfalls

- Spraying more than the threshold allows in one window locks accounts. Check the policy again before each round.
- A hit with a lockout-prone or disabled account can cause an outage. Remove those accounts from the list.
- Validate the result with one authentication. Do not assume that `+` output means the account is usable for every service.
- Spray against LDAP or Kerberos when SMB is noisy. The notes point out that Kerberos pre-authentication failures appear as `4771`, which can be a different signal than `4625`.

## Detection

- Many `4625` (failed logon) events from many accounts in a short period suggest spraying.
- Kerberos pre-authentication failures (`4771`) suggest a spray against LDAP or Kerberos.

## Defense

- Enable multi-factor authentication on all external portals. MFA stops most sprays from producing usable access, though some MFA implementations still reveal whether a password is valid, so reuse risk remains.
- Restrict application access to users who need it. Many applications accept any domain account.
- Keep privileged users on separate administrative accounts, and segment the network so that one compromised account reaches fewer hosts.
- Educate users to choose passphrases. Use a password filter to block dictionary words, month and season names, and variations of the company name.
