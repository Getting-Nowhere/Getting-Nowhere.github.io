---
layout: page
title: "Users, Machines, and Groups"
subtitle: "Account types, identifying attributes, and group scopes that shape every AD attack path"
permalink: /methodology/active-directory/users-machines-and-groups/
---

User, machine, and group objects are the principals that AD uses to grant access. Users are the usual foothold, machine accounts carry domain-level rights of their own, and groups decide what each principal can reach. Before enumerating an environment, know which kinds of account you are looking at and how groups are nested, because most surprising privilege comes from membership, not from a user account's own settings.

## Local accounts

Local accounts live on one host and their rights do not extend across the domain.

| Account | Notes |
|---|---|
| Administrator | Built-in account with RID 500. Full control of the host. |
| Guest | Temporary access with limited rights. Disabled by default on modern systems. |
| SYSTEM | Operating system account with the highest local permission level. It does not appear in user manager and cannot be added to groups. |
| Network Service | Used by the Service Control Manager to run services. |
| Local Service | Used by the Service Control Manager with minimal privileges and anonymous network credentials. |

## Domain accounts

- **Domain users** receive rights from the domain for file servers, printers, and intranet resources, based on their own permissions and their group memberships.
- **KRBTGT** is the service account used by the KDC. Its hash is the basis of golden ticket attacks, so its exposure is a critical finding.
- **Machine accounts** end in `$`. A domain-joined host authenticates as its computer account, which is why SYSTEM on a domain host can reach domain resources.

## Account attributes

| Attribute | Purpose |
|---|---|
| `UserPrincipalName` | Primary logon name, usually the user's email style address |
| `ObjectGUID` | Unique identifier that does not change, even after rename |
| `SAMAccountName` | Legacy logon name used by older clients and servers |
| `objectSID` | Security identifier used in access checks and group membership |
| `sIDHistory` | Earlier SIDs kept after a migration. Abused in SID history attacks |

```powershell
Get-ADUser -Identity USERNAME
```

## Groups

- **Type**: security groups assign permissions. Distribution groups are for email and cannot grant access.
- **Scope**: domain local groups grant access only within their own domain. Global groups grant access in other domains but may only contain accounts from their own domain. Universal groups can span domains in a forest and are stored in the global catalog, so membership changes replicate forest-wide.

```powershell
Get-ADGroup -Filter * | Select-Object samaccountname, groupscope
```

Scope conversions have limits. A global group can become universal only if it is not a member of another global group. A universal group can become global only if it has no universal group members.

## Nested membership

Groups can contain other groups. A user inherits every right of every group above them in the chain. In the notes' example, a user who is not a direct member of a tier 1 group still gets its rights because a group they belong to is nested inside it. Resolve nesting before concluding who is privileged:

```powershell
Get-DomainGroupMember -Identity "Domain Admins" -Recurse
```

## Key group attributes

- `cn`: name of the group.
- `member`: direct members.
- `memberOf`: groups that contain this group. Walk this upward to find inherited rights.
- `groupType`: integer encoding of type and scope.
- `objectSid`: the security principal identifier.

## What to look for

- Accounts with names suggesting service or admin roles that sit in Domain Admins or other built-in groups.
- Groups nested two or three levels deep inside privileged groups.
- Stale or unused accounts that still hold memberships.
- KRBTGT password age and whether it is ever rotated.

## Pitfalls

- Reading only direct membership misses inherited rights. Always resolve nesting recursively.
- A machine account can have rights that look unimportant on paper. Include computer objects when mapping attack paths.

## Defense

Keep the privileged groups small, use separate admin accounts for administrative work, review nesting regularly, and rotate KRBTGT on a schedule. See [AD Security Basics](/methodology/active-directory/ad-security-basics/) and [Rights, Privileges, and Built-in Groups](/methodology/active-directory/ad-rights-and-privileges/).
