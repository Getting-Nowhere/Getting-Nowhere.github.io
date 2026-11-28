---
layout: page
title: "Kerberos, DNS, LDAP, and MSRPC"
subtitle: "The protocols AD depends on and what each one reveals to an assessor"
permalink: /methodology/active-directory/kerberos-dns-ldap-msrpc/
---

AD relies on Kerberos for authentication, DNS for locating services, LDAP for directory queries, and MSRPC for management and replication. Each protocol exposes different information and has different abuse paths, so knowing how a request flows tells you which tool to use and what the logs will show.

## Kerberos

Kerberos is a ticket-based protocol. Passwords are not sent across the network. The domain controller's Key Distribution Center (KDC) issues tickets.

1. **AS-REQ**: The client sends a timestamp encrypted with the user's password key.
2. **AS-REP**: If the KDC can decrypt it, it returns a Ticket Granting Ticket (TGT), encrypted with the krbtgt account's key.
3. **TGS-REQ**: The client presents the TGT and asks for a service ticket (TGS) for a specific SPN.
4. **TGS-REP**: The TGS is encrypted with the NT hash of the service's account. This is the material Kerberoasting targets.
5. **AP-REQ**: The client presents the TGS to the service, which decrypts it with its own key.

The KDC keeps no transaction history. Service tickets are valid only while the TGT behind them is valid.

## DNS

AD uses DNS to locate domain controllers. Clients query for SRV records and then resolve the returned hostname to an IP address. DNS uses TCP and UDP port 53.

```powershell
nslookup DOMAIN
nslookup DC_IP
nslookup DC_HOST
```

Forward lookups confirm the DC for the domain, and reverse lookups map an IP back to a hostname, which helps when building target lists from a scan.

> Many Kerberos-based tools require the domain FQDN and a resolvable DNS server, not an IP address. Set the DC as the DNS resolver for the test host when a tool rejects IPs.
{: .tip }

## LDAP

LDAP is the directory query protocol. A client opens a session with a directory server, and the DC listens for LDAP requests on port 389. Authentication to LDAP uses one of two methods:

- **Simple bind**: a DN and password are sent in a BIND request. Anonymous bind is a form of this.
- **SASL**: a framework that hands the bind to another mechanism, such as Kerberos.

Anonymous LDAP queries may return usernames, groups, and the password policy when the server allows them.

```bash
ldapsearch -H ldap://DC_IP -x -b "BASE_DN" -s sub "(&(objectclass=user))" | grep sAMAccountName: | cut -f2 -d" "
```

## MSRPC

Microsoft RPC interfaces carry most AD management and replication traffic. The ones an assessor meets most often are:

| Interface | Purpose | Assessor relevance |
|---|---|---|
| lsarpc | Local Security Authority; manages local and domain security policy | Policy and privilege information |
| netlogon | Authenticates users and services in the domain | Secure channel and logon traffic |
| samr | Manages the account database (users, groups, computers) | Reconnaissance; BloodHound-style collection |
| drsuapi | Directory Replication Service Remote Protocol | Basis of DCSync |

By default, any authenticated domain user can make samr queries and collect a large amount of domain data. Restricting remote SAM queries to administrators reduces this exposure.

## Workflow

1. Confirm DNS resolution of the DC and its FQDN, then sync the test host's clock to avoid Kerberos skew failures.
2. Check whether anonymous LDAP or SMB null sessions return data (see [Target User Lists and Password Policies](/methodology/active-directory/target-user-lists-and-policies/)).
3. Use authenticated LDAP or samr queries to build the user and group picture (see [Credentialed Enumeration](/methodology/active-directory/credentialed-enumeration/)).
4. Note any service accounts with SPNs for later Kerberoasting.

## What to look for

- DC FQDNs and SRV records that reveal the naming convention
- Anonymous bind or null session access
- Accounts with SPNs, and whether samr is open to all authenticated users

## Pitfalls

- Kerberos fails when the clock drifts too far from the DC, so a failed ticket request may be a time problem rather than a credential problem.
- Anonymous LDAP is often disabled on modern domains. Do not treat a negative result as proof that no user data exists.

## Defense

Restrict remote SAM queries to administrators, disable anonymous access where it is not required, and monitor Kerberos ticket activity for abnormal volume. See [AD Security Basics](/methodology/active-directory/ad-security-basics/) for the broader hardening set.
