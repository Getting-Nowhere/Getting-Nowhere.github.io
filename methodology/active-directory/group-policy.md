---
layout: page
title: "Group Policy"
subtitle: "GPO structure, precedence, and how write rights on a GPO become an attack path"
permalink: /methodology/active-directory/group-policy/
---

Group Policy is a Windows feature that applies configuration to user and computer accounts. A Group Policy Object (GPO) is a collection of settings with a unique GUID, linked to a site, domain, or OU. Anyone who can modify a GPO can change settings for every object in its scope, so GPO rights are a common route to lateral movement and privilege escalation.

## Processing levels

| Level | Scope |
|---|---|
| Local Group Policy | Set on the host itself. Overwritten by any conflicting setting at a higher level |
| Site | Settings for the Enterprise Site the host belongs to, for example access controls for a restricted building |
| Domain | Settings for the whole domain, such as password policy and logon banners |
| OU | Settings for users and computers in specific OUs, such as mapped drives or PowerShell access |
| Nested OU | Exceptions for sub-OUs, such as different AppLocker rules for a security team |

Processing runs top down. A GPO linked to a parent OU is applied before those linked to its children, so the later, more specific setting wins. Computer policy outranks user policy for the same setting.

## Precedence controls

- **Enforced** on a GPO stops lower-level GPOs from overriding its settings. An enforced Default Domain Policy takes precedence over all other levels.
- **Block Inheritance** on an OU stops higher-level GPOs from applying to that OU.
- If both are set, **No Override** takes precedence over Block Inheritance.

## Attack surface

A GPO becomes an attack path when a low-privileged principal can edit it and the GPO is linked to an OU holding accounts or computers the principal can reach. Common abuses include:

- Granting additional user rights such as SeDebugPrivilege, SeTakeOwnershipPrivilege, or SeImpersonatePrivilege
- Adding a local administrator on the affected hosts
- Creating an immediate scheduled task that runs a command

## Enumeration

```powershell
Get-DomainGPO | Select-Object displayname
Get-GPO -All | Select-Object DisplayName
Get-GPO -Guid GPO_GUID
$sid = Convert-NameToSid "Domain Users"
Get-DomainGPO | Get-ObjectAcl | Where-Object {$_.SecurityIdentifier -eq $sid}
```

The last command lists GPOs where a group has write rights. Look for `WriteProperty` or `WriteDacl` granted to a broad group such as Domain Users.

> Once a writable GPO is found, use BloodHound to see which OU it links to and which computers and users fall inside that OU before testing anything.
{: .tip }

## Workflow

1. List GPOs and their GUIDs, then convert GUIDs to display names.
2. Find GPOs writable by your principal, including through nested group membership.
3. Map each writable GPO to its linked OUs and the objects inside them.
4. Confirm the change is within the agreed scope, because a GPO edit can reach every object in its scope.

## What to look for

- Broad groups (Domain Users, Authenticated Users) with write rights on GPOs
- GPOs linked to OUs that contain servers, workstations, or privileged accounts
- Nested group membership that quietly grants GPO write rights

## Pitfalls

- A GPO edit affects every object in scope, not only your test host. Limit the change and revert it.
- Blocked inheritance and enforced settings change the result, so check precedence before assuming a setting will apply.

## Defense

- Restrict who can edit GPOs and audit GPO permission changes regularly.
- Review the security settings in GPOs: account policies, local policies, software restriction, application control, and advanced audit configuration. See [AD Security Basics](/methodology/active-directory/ad-security-basics/).
- For the broader set of misconfigurations, see [Other Misconfigurations](/methodology/active-directory/other-misconfigurations/).
