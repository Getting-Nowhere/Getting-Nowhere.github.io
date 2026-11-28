---
layout: page
title: "AD Fundamentals"
subtitle: "The objects, logical structure, and key terms that shape every AD assessment"
permalink: /methodology/active-directory/ad-fundamentals/
---

Active Directory Domain Services (AD DS) stores objects such as users, computers, groups, organizational units (OUs), and Group Policy Objects (GPOs). It also provides the authentication and authorization that domain resources depend on. Before testing, confirm how the directory is organized, because that structure decides where accounts, rights, and trusts live.

## Logical structure

| Component | Description |
|---|---|
| Forest | Top-level container holding one or more domains that may trust one another |
| Tree | Domains sharing a contiguous namespace, starting from a single root domain |
| Domain | Logical group of objects with its own database and policies |
| OU | Container used to delegate administration and to link GPOs to a subset of objects |
| Site | Computers across one or more subnets connected by high-speed links |

Child domains do not automatically trust every other domain in the forest. A user in one domain can reach resources in another only where a trust path exists, which is why trust mapping is a separate step.

## Terms that matter during an assessment

| Term | Why it matters |
|---|---|
| Security principal | Anything the operating system can authenticate. Users, computers, and groups have a SID |
| SID | Unique identifier for a principal, used in ACLs, access tokens, and group checks |
| GUID (ObjectGUID) | 128-bit identifier that stays the same for the life of the object |
| sAMAccountName | Legacy logon name |
| userPrincipalName | Modern logon name, usually in email format |
| SPN | Maps a service instance to the account it runs under; the basis of Kerberoasting |
| adminCount | Set to 1 on accounts protected by SDProp; a quick indicator of privileged accounts |
| sIDHistory | Earlier SIDs kept after a migration; abused in SID history attacks |
| ACL and ACE | Ordered access entries on an object; the basis of ACL attacks |
| Distinguished name | Full path to an object, for example CN=USERNAME,OU=Staff,DC=... |

## FSMO roles

| Role | Function |
|---|---|
| Schema Master | Holds the writable copy of the schema that defines object classes and attributes |
| Domain Naming Master | Controls domain names and prevents duplicate domains in a forest |
| RID Master | Hands out RID blocks so every object SID stays unique |
| PDC Emulator | Authoritative for password changes, GPOs, and time; a frequent target |
| Infrastructure Master | Translates GUIDs, SIDs, and DNs across domains |

## Key data stores

- **NTDS.dit** lives on each DC under the NTDS folder of the Windows directory. It holds AD data, group memberships, and password hashes for every account. Accounts with reversible encryption enabled are stored with RC4 encryption rather than a one-way hash, and a Domain Admin can recover the key from the registry.
- **SYSVOL** is a share readable by all authenticated users. It holds replicated policies, logon scripts, and GPO files.

## Workflow

1. Identify the domain FQDN, its NetBIOS name, and any child or trusted domains.
2. Identify the domain controllers and the FSMO role holders, especially the PDC Emulator.
3. Record each trust and its direction.
4. Identify privileged groups and OUs that carry delegated rights.

```powershell
Get-ADDomain
Get-ADTrust -Filter *
Get-ADGroupMember -Identity "Domain Admins"
```

> `Get-ADDomain` reports the domain SID, functional level, and any child domains, which is usually the fastest way to map the environment.
{: .tip }

## What to look for

- Child domains and trusts, each of which is a new authentication boundary to test
- Domain controllers and SYSVOL, the most valuable central targets
- Accounts with adminCount set to 1 and members of privileged groups

## Pitfalls

- An account in one domain is not automatically trusted elsewhere. Do not assume reachability from the forest layout alone.
- Local accounts on a host are managed by that host's SAM database. Their rights do not carry across the domain.

## Defense

Keep privileged group membership small, restrict interactive logon to DCs, protect NTDS.dit and SYSVOL access, and audit changes to directory objects. See [AD Security Basics](/methodology/active-directory/ad-security-basics/).
