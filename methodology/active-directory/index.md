---
layout: page
title: "Active Directory Attack Path"
subtitle: "Methodology overview, decision flow, and checklist for Active Directory assessments"
permalink: /methodology/active-directory/
---

Active Directory (AD) is the identity backbone of most Windows networks, so one compromised account can expose the whole domain. This section lays out a repeatable attack path: understand the directory, gain a first foothold, enumerate with credentials, escalate, and move across trusts. Each linked page covers one concept or technique.

> Every technique here exposes or changes credentials. Run each one only inside the agreed scope and rules of engagement, and record every account you touch and every change you make so it can be reverted.
{: .warning }

## Phases

| Phase | Goal | Pages |
|---|---|---|
| Foundations | Understand objects, authentication, groups, and rights | ad-fundamentals, ntlm-authentication, kerberos-dns-ldap-msrpc, users-machines-and-groups, ad-rights-and-privileges, group-policy, ad-security-basics |
| External recon | Map public exposure, staff names, and leaked credentials | external-and-internal-recon |
| Internal recon (no credentials) | Find DCs, hosts, services, and valid usernames | external-and-internal-recon, target-user-lists-and-policies |
| Initial foothold | Obtain the first valid credential or hash | password-spraying, llmnr-nbt-ns-poisoning, bleeding-edge-vulns |
| Credentialed enumeration | Map users, groups, shares, sessions, and attack paths | credentialed-enumeration, living-off-the-land-ad, security-controls-enumeration |
| Post-compromise | Escalate privileges and move laterally | kerberoasting, acl-enumeration, acl-abuse, dcsync, privileged-access, kerberos-double-hop, other-misconfigurations |
| Trust attacks | Cross domain and forest boundaries | domain-trusts, cross-forest-trust-abuse |
| Reporting | Recommend durable fixes | ad-prevention |

## Placeholder legend

Every host, account, and secret in these pages is a placeholder.

| Placeholder | Meaning |
|---|---|
| DOMAIN | Fully qualified domain name, for example corp.example.local |
| DOMAIN_NB | NetBIOS (short) name of the domain |
| BASE_DN | Distinguished name of the domain root, for example DC=corp,DC=example,DC=local |
| CHILD_DOMAIN, PARENT_DOMAIN | Child and parent domain FQDNs within one forest |
| TRUSTED_DOMAIN | A domain in a trusted, separate forest |
| DC_IP, DC_HOST | Domain controller IP address and hostname |
| TARGET_IP, TARGET_HOST | Any other in-scope host |
| USERNAME, PASSWORD | Credentials you hold |
| TARGET_USER, TARGET_GROUP | The object you are abusing or attacking |
| NTLM_HASH, KRBTGT_HASH | NT hash of an account, and of the krbtgt account |

## Decision flow

```text
[No credentials]
  Passive recon: DNS, ASN, OSINT, breach data
  Can you list usernames (SMB null session, LDAP anonymous bind, Kerberos pre-auth)?
    yes -> read the password policy -> build target list -> spray within the lockout threshold
    no  -> listen for LLMNR/NBT-NS traffic; check patch level for bleeding-edge flaws

[Credential or hash obtained]
  Validate with one authentication attempt
  Credentialed enumeration: users, groups, admins, shares, sessions, BloodHound
  SPN accounts present?                    -> kerberoasting
  Rights over other objects?               -> acl-enumeration -> acl-abuse
  Replication rights?                      -> dcsync
  Local admin, RDP, WinRM, or SQL admin?   -> privileged-access
  Stored secrets, GPP, AS-REP, misconfig?  -> other-misconfigurations

[Higher privilege or a new domain reached]
  Map trusts -> domain-trusts, cross-forest-trust-abuse
  Record the attack path, revert temporary changes, then write findings using ad-prevention
```

## Checklist

- [ ] Scope, rules of engagement, and lockout policy confirmed in writing
- [ ] Domain name, DCs, and FSMO role holders identified
- [ ] Passive and unauthenticated recon completed
- [ ] Valid usernames collected and checked against lockout thresholds
- [ ] Password policy recorded (length, complexity, threshold, observation window)
- [ ] Spray run one password per observation window, results logged
- [ ] Poisoning and bleeding-edge checks run only where rules allow
- [ ] Credentialed enumeration: users, privileged groups, shares, trusts, BloodHound
- [ ] SPN service tickets requested and cracked offline
- [ ] ACL edges reviewed; every change recorded for cleanup
- [ ] Replication rights and krbtgt exposure reviewed
- [ ] Trusts tested for foreign group membership and SID history
- [ ] Temporary accounts, group memberships, SPNs, and passwords reverted

## Page links

**Foundations**

- [AD Fundamentals](/methodology/active-directory/ad-fundamentals/)
- [NTLM Authentication](/methodology/active-directory/ntlm-authentication/)
- [Kerberos, DNS, LDAP, and MSRPC](/methodology/active-directory/kerberos-dns-ldap-msrpc/)
- [Group Policy](/methodology/active-directory/group-policy/)
- [AD Security Basics](/methodology/active-directory/ad-security-basics/)
- [Users, Machines, and Groups](/methodology/active-directory/users-machines-and-groups/)
- [Rights, Privileges, and Built-in Groups](/methodology/active-directory/ad-rights-and-privileges/)

**Recon and enumeration**

- [External and Internal Recon](/methodology/active-directory/external-and-internal-recon/)
- [Credentialed Enumeration](/methodology/active-directory/credentialed-enumeration/)
- [Living Off the Land in AD](/methodology/active-directory/living-off-the-land-ad/)
- [Enumerating Security Controls](/methodology/active-directory/security-controls-enumeration/)

**Initial foothold**

- [Target User Lists and Password Policies](/methodology/active-directory/target-user-lists-and-policies/)
- [Password Spraying](/methodology/active-directory/password-spraying/)
- [LLMNR and NBT-NS Poisoning](/methodology/active-directory/llmnr-nbt-ns-poisoning/)
- [Bleeding-Edge Vulnerabilities](/methodology/active-directory/bleeding-edge-vulns/)

**Post-compromise**

- [Kerberoasting](/methodology/active-directory/kerberoasting/)
- [ACL Enumeration](/methodology/active-directory/acl-enumeration/)
- [ACL Abuse](/methodology/active-directory/acl-abuse/)
- [DCSync](/methodology/active-directory/dcsync/)
- [Privileged Access](/methodology/active-directory/privileged-access/)
- [Kerberos Double Hop](/methodology/active-directory/kerberos-double-hop/)
- [Other Misconfigurations](/methodology/active-directory/other-misconfigurations/)

**Trusts**

- [Domain Trusts](/methodology/active-directory/domain-trusts/)
- [Cross-Forest Trust Abuse](/methodology/active-directory/cross-forest-trust-abuse/)

**Reporting**

- [AD Prevention](/methodology/active-directory/ad-prevention/)
