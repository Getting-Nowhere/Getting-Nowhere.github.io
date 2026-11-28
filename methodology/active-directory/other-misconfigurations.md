---
layout: page
title: "Other Misconfigurations"
subtitle: "Common AD settings that leak credentials or allow privilege escalation"
permalink: /methodology/active-directory/other-misconfigurations/
---

Many of the most useful findings in an AD assessment are not exotic exploits. They are settings that were changed for convenience and never reverted: passwords in description fields, stored GPP passwords, accounts that skip pre-authentication, and groups that were given rights they should not have. This page covers the misconfigurations from the notes that do not fit one of the other pages. Each one is cheap to check, so run the checks early and record every result, including the negative ones.

## Workflow

1. Run the read-only checks first: descriptions, UAC flags, SYSVOL, and DNS.
2. Check Kerberos pre-authentication and GPO rights.
3. Note the exposed credentials and handle them as secrets.
4. Report each misconfiguration with the object, the setting, and the fix.

## Credentials in the directory and on file shares

| Check | Command or location | What it shows |
|---|---|---|
| Descriptions | `Get-DomainUser * \| Select-Object samaccountname,description` | Passwords typed into free-text fields |
| Scripts | `ls \\DC_HOST\SYSVOL\DOMAIN\scripts` | Batch, VBScript, or PowerShell files with embedded credentials |
| GPP passwords | Files in SYSVOL with a `cpassword` attribute | Passwords encrypted with a published AES key |
| GPP autologin | `crackmapexec smb DC_IP -u USERNAME -p PASSWORD -M gpp_autologin` | Autologon settings in group policy |
| DNS records | `adidnsdump -u DOMAIN\\USERNAME ldap://DC_IP` | Host names and addresses for naming patterns |

SYSVOL is readable by all authenticated users. A `cpassword` value can be decrypted with `gpp-decrypt`, and the result is the cleartext password:

```bash
gpp-decrypt CPASSWORD_VALUE
```

Record the file path and the account the password belongs to. Do not copy the password into the report.

## Account flags

```powershell
Get-DomainUser -UACFilter PASSWD_NOTREQD | Select-Object samaccountname,useraccountcontrol
```

`PASSWD_NOTREQD` means the account is not subject to the minimum password length, so it may have a short or empty password.

### AS-REP roasting

Accounts with `DONT_REQ_PREAUTH` set answer an AS-REQ without proving knowledge of the password. Their AS-REP is encrypted with the account's key, so it can be cracked offline. No SPN is needed.

```powershell
Get-DomainUser -PreauthNotRequired | select samaccountname,userprincipalname,useraccountcontrol | fl
.\Rubeus.exe asreproast /user:USERNAME /nowrap /format:hashcat
```

From Linux, Impacket's `GetNPUsers.py` checks a list of users without a password:

```bash
GetNPUsers.py DOMAIN/ -dc-ip DC_IP -no-pass -usersfile valid_ad_users
```

Crack with hashcat mode `18200`. An attacker with GenericWrite or GenericAll over an account can enable this flag and obtain the AS-REP.

## Privileged group and delegation issues

- **Exchange groups.** The Exchange Windows Permissions group is not a protected group, but its members can write a DACL on the domain object. That lets them grant DCSync rights (see [DCSync](/methodology/active-directory/dcsync/)). Accounts can be added to it through DACL misconfigurations, or through a compromised member of the Account Operators group. The Organization Management group can access the mailboxes of all domain users.
- **Printer bug.** Any domain user can ask the Print Spooler on a host to authenticate to a host of their choice, using MS-RPRN. Check whether the spooler is running on DCs with a tool such as `Get-SpoolStatus`. This can be relayed to LDAP and used for DCSync or RBCD.
- **Exchange PushSubscription.** A domain user with a mailbox can make Exchange authenticate to a host of their choice over HTTP. The Exchange service runs as SYSTEM, so this can be relayed to LDAP.
- **MS14-068.** A Kerberos weakness in PAC validation allowed a forged PAC to be accepted, which made a user appear to be a Domain Admin. Check the patch level and do not use this on a live environment without approval.
- **LDAP credential exposure.** Printers and applications often store LDAP credentials for "test connection" features. Changing the server address to a host you control can capture the bind in cleartext on port 389.

## GPO rights

GPOs are a route to code execution and persistence on every host they apply to. Check which groups hold write rights on each GPO:

```powershell
Get-GPO -All | Select DisplayName
$sid = Convert-NameToSid "Domain Users"
Get-DomainGPO | Get-ObjectAcl | ? {$_.SecurityIdentifier -eq $sid}
```

If Domain Users holds WriteProperty or WriteDacl over a GPO that applies to computers, you can grant yourself full control of that GPO. The notes describe adding a local admin, adding a privilege such as SeDebugPrivilege, or creating an immediate scheduled task, with a tool such as SharpGPOAbuse.

## What to look for

- Passwords in descriptions, scripts, or SYSVOL
- `DONT_REQ_PREAUTH` or `PASSWD_NOTREQD` on user accounts
- Exchange or other non-privileged groups with DACL-write rights on the domain
- GPOs with broad write rights that apply to many computers

## Pitfalls

- A password in a description field may be a test value. Verify before reporting it as live.
- GPP `cpassword` values can be decrypted by any domain user, so the exposure is wider than the admin who created the policy.
- AS-REP roasting finds accounts that can be cracked, but many will not crack.

## Defense

- Remove credentials from descriptions, scripts, and SYSVOL. Rotate any password that has been exposed.
- Remove the `DONT_REQ_PREAUTH` and `PASSWD_NOTREQD` flags unless an application needs them.
- Keep Exchange and other service groups out of rights over the domain object.
- Restrict write rights on GPOs to the administrators who manage them, and audit changes to GPOs.
