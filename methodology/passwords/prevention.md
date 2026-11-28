---
layout: page
title: "Password Prevention"
subtitle: "Controls that stop the credential attacks covered in this section, mapped to the technique they address"
permalink: /methodology/passwords/prevention/
---

Most credential attacks in this section succeed because of a small set of conditions: weak or reused passwords, no lockout, plaintext secrets in files and shares, cached or saved credentials on hosts, unencrypted protocols, and privileged accounts used on everyday systems. This page maps each technique to the control that addresses it, so the findings in a report can be paired with a concrete fix.

## Control map

| Technique | Condition that enables it | Control |
|-----------|---------------------------|---------|
| Password spraying and guessing | No lockout threshold, weak passwords | Enforce a lockout threshold and a password policy with a blocklist |
| Offline cracking of hashes | Fast hash types, short or predictable passwords | Long passphrases, slow password hashing where supported, blocklists of common mutations |
| Hash reuse (pass-the-hash) | Shared local administrator hashes | Unique local administrator passwords per host |
| SAM, SYSTEM and SECURITY dumps | Local administrator access | Limit local admin rights, audit registry hive access |
| NTDS.dit extraction | Domain admin exposure, shadow copy creation | Tiered administration, monitor shadow copies on domain controllers |
| LSASS memory extraction | Privileged sessions on exposed hosts | Credential Guard where supported, limit debug privileges |
| Credential Manager and DPAPI | Saved domain credentials | Do not save privileged credentials, enable Credential Guard |
| Share and config hunting | Secrets in files | Remove secrets from files, use a secrets vault, restrict share access |
| Traffic capture | Unencrypted protocols | Enforce encrypted counterparts such as LDAPS, HTTPS and SMTPS |

## Priority actions

1. Set and test an account lockout threshold. The notes record that default domain policy did not enforce one, so check the effective setting and the Group Policy that applies to each OU.
2. Give every host a unique local administrator password. Reuse across hosts turns one recovered hash into a domain-wide problem.
3. Stop using domain administrator accounts on workstations and member servers. Use separate, tiered admin accounts.
4. Remove plaintext credentials from scripts, configuration files, spreadsheets and shares. Rotate any credential that was exposed.
5. Move services to encrypted protocols and verify that clients refuse the unencrypted fallback.
6. Monitor for the high-signal events in this section: repeated failed logons across many accounts, `reg.exe save` of SAM, SYSTEM or SECURITY, creation of shadow copies on domain controllers, and new saved credentials for privileged accounts.

## Hardening guidance for passwords

- Require long passphrases, and screen new passwords against breached-password and common-mutation lists. The rules used in attack tooling are the same ones defenders should block.
- Do not allow the username or the company name in the password.
- Require multi-factor authentication for remote access and for all administrative accounts.
- Disable or rename default accounts, and change vendor default passwords on every service before deployment.
- Use a secrets vault for service account passwords and automate their rotation.

> Pair each finding with the affected account, the host or share, and the control that closes it. A recommendation that names the control and the owner is easier to act on than a general statement about weak passwords.
{: .tip }

## Verifying the fix

Repeat the test that found the weakness. Re-run the spray with the same policy, re-check the registry hives' permissions, confirm that the share no longer returns the pattern, and confirm that the protocol refuses the unencrypted connection. Record the retest result in the report.
