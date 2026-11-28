---
layout: page
title: "ACL Enumeration"
subtitle: "Find which AD objects your account can change, and how those rights chain"
permalink: /methodology/active-directory/acl-enumeration/
---

Every AD object has an access control list (ACL), and the entries in that list decide who can read, change, or take control of the object. Misconfigured entries are one of the most common routes from a low-privilege account to a privileged one. Enumeration maps every object that your account, or any group it belongs to, has rights over. Those edges are the input to [ACL Abuse](/methodology/active-directory/acl-abuse/).

## Primer

- An ACL is a list of access control entries (ACEs). Each object has an ACL, and each ACL can hold many ACEs.
- The DACL controls who is allowed or denied access. If a DACL is missing, everyone gets full rights. If it exists but is empty, everyone is denied.
- The SACL controls auditing. It records access attempts and whether they succeeded.
- Each ACE has four parts: the SID of the trustee, the ACE type (allow, deny, or audit), inheritance flags, and an access mask that defines the rights.

### Rights that matter for attack paths

| Right | What it allows | Typical abuse |
|---|---|---|
| ForceChangePassword | Reset a user's password without knowing it | `Set-DomainUserPassword` |
| GenericWrite | Write non-protected attributes | Set an SPN for Kerberoasting; add a group member; RBCD on a computer |
| AddSelf | Add yourself to a group | `Add-DomainGroupMember` |
| GenericAll | Full control of the object | Change group membership, reset password, or Kerberoast |
| WriteOwner | Change the owner | `Set-DomainObjectOwner` |
| WriteDACL | Edit the ACL | `Add-DomainObjectACL` |
| AllExtendedRights | Use every extended right | Reset password or add group member |

If you have GenericAll over a computer with LAPS, you can read its local admin password.

### How ACL attacks appear in real environments

- **Forgotten password permissions.** Help desk accounts often hold reset rights over privileged users.
- **Group management rights.** Staff who can add members to a group may be able to add themselves to a privileged group.
- **Excessive rights.** Software installs and legacy changes can leave users, computers, or groups with rights nobody intended. Exchange, for example, makes many ACL changes at install time.

## Workflow

1. Start from the account you control and find the objects it has rights over.
2. For each object you reach, repeat the search. Stop when you reach a privileged group or a sensitive object.
3. Expand group memberships, because nested groups inherit their rights.
4. Map the chain in BloodHound, then verify each edge with PowerView.
5. Record every edge and the evidence for it.

## Step 1: Map rights for one account

```powershell
Import-Module .\PowerView.ps1
$sid = Convert-NameToSid USERNAME
Get-DomainObjectACL -Identity * | ? {$_.SecurityIdentifier -eq $sid}
```

Without `-ResolveGUIDs`, rights such as password reset appear as raw GUIDs. Add it to see readable names:

```powershell
Get-DomainObjectACL -ResolveGUIDs -Identity * | ? {$_.SecurityIdentifier -eq $sid}
```

To map a GUID to a name, search the extended-rights container:

```powershell
$guid = "GUID_FROM_OUTPUT"
Get-ADObject -SearchBase "CN=Extended-Rights,$((Get-ADRootDSE).ConfigurationNamingContext)" -Filter {ObjectClass -like 'ControlAccessRight'} -Properties * | Select Name,DisplayName,DistinguishedName,rightsGuid | ? {$_.rightsGuid -eq $guid}
```

## Step 2: Check every user

Build a user list, then check the ACL on each account:

```powershell
Get-ADUser -Filter * | Select-Object -ExpandProperty SamAccountName > ad_users.txt
foreach($line in [System.IO.File]::ReadLines("C:\PATH\ad_users.txt")) { get-acl "AD:\$(Get-ADUser $line)" | Select-Object Path -ExpandProperty Access | Where-Object {$_.IdentityReference -match 'DOMAIN\\USERNAME'} }
```

## Step 3: Continue from each object reached

Repeat the search with the newly controlled account. In the notes, the chain ran from one account with ForceChangePassword to a second account with GenericWrite over a help desk group. That group was nested into a group with GenericAll over a third account, which held replication rights. Each hop extended the path.

## Step 4: Use BloodHound

Mark the controlled account as owned, then check its outbound object control. Follow the edges (ForceChangePassword, GenericWrite, GenericAll, and so on) to the next node. BloodHound shows nested group rights that are easy to miss in raw output.

## What to look for

- Non-privileged accounts with any right over a user, group, or computer
- Help desk or operator groups with password reset or group membership rights
- Nested groups that grant rights through a parent group
- Any right over the domain object that includes replication rights (see [DCSync](/methodology/active-directory/dcsync/))

## Pitfalls

- Raw output hides the chain. Always resolve GUIDs and walk the path through each group.
- Most rights are inherited. An ACE on a parent OU may apply to every object beneath it.
- Verify rights before acting. An edge that looks like `GenericWrite` may not allow the change you need.

## Defense

- Audit ACLs on privileged objects regularly and remove rights that are not needed. BloodHound is useful for this audit.
- Keep the membership of high-impact groups under monitoring.
- Enable advanced security auditing so that ACL changes produce Event ID `5136` (a directory service object was modified).
