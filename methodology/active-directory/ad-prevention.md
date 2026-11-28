---
layout: page
title: "AD Prevention"
subtitle: "Turn assessment findings into durable fixes, with the detection signal for each"
permalink: /methodology/active-directory/ad-prevention/
---

The attack pages in this section show how an account moves through a domain. This page does the reverse. It collects the mitigations and detection signals from the notes, groups them by attack, and sets out how to write them up so the client can act on them. Use it when writing findings, and use [AD Security Basics](/methodology/active-directory/ad-security-basics/) for the wider baseline.

## Workflow

1. List each finding from the assessment with the attack page it came from.
2. Match it to the control and detection signal in the table below.
3. Write the finding using the template in the next section.
4. Give the client a retest plan for every finding.

## Controls by attack

| Attack | Controls | Detection signal |
|---|---|---|
| Password spraying | Multi-factor authentication on external portals; restrict application access to users who need it; separate admin accounts; network segmentation; passphrases and a password filter for dictionary words, seasons, and company-name variants | Bursts of `4625` (failed logon) from many accounts; `4771` (Kerberos pre-authentication failure) for LDAP or Kerberos spraying |
| LLMNR and NBT-NS poisoning | Disable LLMNR through Group Policy; set `NetbiosOptions` to `2` on each interface to disable NBT-NS; require SMB signing to block relay | Not covered in the notes; monitor for unexpected name-resolution broadcasts |
| Kerberoasting | Managed service accounts (MSA) or group managed service accounts (gMSA); long, unique passwords for accounts that cannot use them; keep service accounts out of privileged groups | Audit Kerberos service ticket operations; abnormal `TGS-REQ` and `TGS-REP` volume; RC4 requests in an AES environment |
| ACL abuse | Regular BloodHound-based audit of dangerous ACLs; remove unneeded rights; monitor high-impact group membership | Advanced security audit policy; `5136` (directory object modified) on the domain object and on groups |
| DCSync | Review replication rights; treat holders as Tier 0; turn off reversible encryption where not needed | `5136` on the domain object |
| NoPac | Set `ms-DS-MachineAccountQuota` to 0; patch | Not covered in the notes |
| PetitPotam and NTLM relay | Extended Protection for Authentication; require SSL for AD CS web enrollment and certificate enrollment; disable NTLM for DCs and on AD CS servers | Not covered in the notes |
| Living off the land | Script block logging; remove the PowerShell 2.0 engine | PowerShell Operational log |
| Security controls | Limit who can read LAPS passwords; enforce AppLocker by path and publisher; keep Defender real-time protection on | Defender status reports; AppLocker audit events |
| Trust abuse | Enable SID filtering on external and forest trusts; remove trusts that are not needed; remove foreign principals from built-in admin groups | Changes to trust objects and to admin group membership |

## Writing a finding

Each finding should be specific enough that the client can fix it without a call to you. Use the same structure for every item:

1. **Title.** The misconfiguration, for example "Domain Users can reset passwords for two privileged accounts."
2. **Affected objects.** Names of the accounts, groups, hosts, or GPOs. Use the names from the client's environment.
3. **Evidence.** The command you ran and the relevant output. Redact passwords, hashes, and tickets, and show only the counts when you have many results.
4. **Impact.** What an attacker gains, and the attack path it enables. Link to the relevant attack page in this section.
5. **Recommendation.** The control from the table above, applied to the affected objects.
6. **Retest.** The check that confirms the fix, such as the BloodHound query that should no longer return the path, or the spray that should fail at the same policy.

> Do not put recovered passwords or hashes in the report body. Refer to them by account name and state how they were obtained. Send any secrets through the client's agreed secure channel, and delete them from your own systems at the end of the engagement.
{: .danger }

## Cleanup check

Before closing the engagement, confirm each change you made has been reverted and recorded:

- Fake SPNs removed from accounts
- Temporary group memberships removed
- Test passwords reset, or the client has notified the owner
- Machine accounts created during testing removed
- Session configurations and temporary services removed
- Any changes to trusts, GPOs, or SQL configuration reverted

## Retest and tracking

Schedule a retest after the client reports fixes. Repeat the same checks: list the spray results at the same policy, rerun the ACL path search, check that the disabled features are off, and confirm the audit events fire. Report any finding that is still open, with the date of the retest.
