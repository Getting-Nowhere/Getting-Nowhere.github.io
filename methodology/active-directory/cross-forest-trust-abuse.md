---
layout: page
title: "Cross-Forest Trust Abuse"
subtitle: "Kerberoast across forests, find foreign admins, and check SID history"
permalink: /methodology/active-directory/cross-forest-trust-abuse/
---

A forest trust links two separate AD forests. Authentication can cross the trust when it is permitted, so an attack from one forest can reach accounts in the other. Three routes matter: Kerberoasting an SPN account in the partner forest, finding privileged users from one forest that are members of groups in the other, and abusing SID history after a migration. Each route depends on the trust type, its direction, and whether SID filtering is enabled. Start with [Domain Trusts](/methodology/active-directory/domain-trusts/) to map the trust before you test it.

## Workflow

1. Confirm the trust type and direction with `Get-DomainTrust`.
2. Test cross-forest Kerberoasting with an account that can authenticate into the other forest.
3. Look for foreign group memberships and privileged accounts in the other forest.
4. Check whether a privileged account in one forest has the same name and password in the other.
5. Check SID filtering and SID history on migrated accounts.

## Route 1: Cross-forest Kerberoasting

Kerberoasting works across a trust when authentication is permitted. You may not be able to escalate in your own domain, but a Domain Admin or Enterprise Admin account in the other forest may have an SPN. Start from Linux with an account that can authenticate to the other domain:

```bash
GetUserSPNs.py -target-domain TRUSTED_DOMAIN DOMAIN/USERNAME
GetUserSPNs.py -request -target-domain TRUSTED_DOMAIN -outputfile tickets DOMAIN/USERNAME
hashcat -m 13100 tickets /usr/share/wordlists/rockyou.txt
```

From Windows, list SPN accounts in the other domain and check whether each one is a member of Domain Admins there:

```powershell
Get-DomainUser -SPN -Domain TRUSTED_DOMAIN | select SamAccountName
Get-DomainUser -Domain TRUSTED_DOMAIN -Identity SERVICE_USER | select samaccountname,memberof
.\Rubeus.exe kerberoast /domain:TRUSTED_DOMAIN /user:SERVICE_USER /nowrap
```

A service account in the partner domain that is a Domain Admin in that domain can be cracked offline, and the password may also work in your own domain.

## Route 2: Foreign group membership

Only domain local groups accept security principals from outside their forest. In a bidirectional forest trust, an admin account from one domain can therefore be a member of a built-in admin group in the other. Taking over that admin account gives control of the other domain by group membership.

Find foreign members with PowerView:

```powershell
Get-DomainForeignGroupMember -Domain TRUSTED_DOMAIN
Convert-SidToName FOREIGN_SID
```

Each entry shows a foreign security principal (a SID) in a local group. Convert it to a name to see which account in the other domain it is. In the notes, the built-in administrator from one domain was a member of the Administrators group in the other, which gave full access through `Enter-PSSession`:

```powershell
Enter-PSSession -ComputerName DC_HOST.TRUSTED_DOMAIN -Credential DOMAIN\administrator
```

From Linux, BloodHound's Python collector gathers the data for both domains. Each domain needs its own collection, and the Linux host's DNS must resolve the domain names:

```bash
bloodhound-python -d DOMAIN -dc DC_HOST -c All -u USERNAME -p PASSWORD
bloodhound-python -d TRUSTED_DOMAIN -dc TRUSTED_DC_HOST -c All -u USERNAME@DOMAIN -p PASSWORD
zip -r bloodhound.zip *.json
```

In the BloodHound interface, the "Users with foreign domain group membership" query shows these cases.

## Route 3: Password reuse

If you have a clear-text password or NT hash for an admin account in one forest, check whether an account with the same name in the other forest uses the same secret. Test this with a single authentication, and record the result as a finding.

## Route 4: SID history

When a user is migrated from one forest to another, its SID history can keep the SID of an account in its old domain. If SID filtering is not enabled, that SID is added to the user's token when it crosses the trust. A migrated user can keep the admin rights it held in its old domain, even while it is a member of the new forest.

Check the SID history attribute and the filtering setting on the trust before testing. Do not change SID history on a live environment.

## What to look for

- Partner-forest SPN accounts that are Domain Admins
- Foreign security principals in built-in admin groups
- Admin accounts with the same name and password across forests
- Migrated accounts with SID history from privileged groups, and trusts without SID filtering

## Pitfalls

- Cross-forest attacks depend on the trust being permitted. A trust with SID filtering or selective authentication may block the path.
- DNS must resolve the other domain for Kerberos and BloodHound to work. Add the DC as a resolver if a tool rejects IP addresses.
- Each finding may involve credentials in two forests. Keep them in separate notes, and clean up in each.

## Defense

- Enable SID filtering on forest trusts. The notes show that without it, SID history can carry admin rights across the trust.
- Limit trusts to the direction and scope that the business needs, and enable selective authentication where it applies.
- Remove foreign security principals from built-in admin groups unless there is a documented need.
- Give partner-forest service accounts strong, unique passwords, and do not give them Domain Admin rights in their own domain.
- Do not reuse admin passwords across forests.
