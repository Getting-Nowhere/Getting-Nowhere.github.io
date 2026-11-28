---
layout: page
title: "External and Internal Recon"
subtitle: "Passive and unauthenticated discovery of the organisation's public footprint and internal domain services"
permalink: /methodology/active-directory/external-and-internal-recon/
---

Reconnaissance builds the target list for every later step. External recon maps what the organisation exposes to the internet and what staff data is public. Internal recon, done from inside the network without credentials, finds the domain controllers, the hosts that matter, and valid usernames. Both phases should stay within the agreed scope, and both produce data that feeds the password spraying and poisoning pages.

## External recon

### What to collect

| Data point | Examples |
|---|---|
| IP space | ASN, netblocks, cloud presence, hosting providers, DNS records |
| Domain information | Administrators, subdomains, public services such as mail, DNS, VPN, and web portals |
| Usernames and schema | Email addresses and username formats that can seed a valid user list |
| Data disclosures | Public documents with metadata, exposed code repositories, and cloud storage |
| Breach data | Leaked credentials or hashes tied to corporate email addresses |

### Where to look

- **ASN and IP registrars**: regional registries and BGP toolkits show netblocks and the owning ASN. Smaller companies often have no ASN of their own.
- **DNS**: validate findings with DNS lookups against the target nameservers and public resolvers.
- **Social media, websites, and contact pages**: useful for staff names and the username format.
- **Code and cloud storage**: public repositories and storage buckets can expose configuration files and credentials.
- **Breach data**: check corporate addresses against breach-notification services, and search breach aggregators for cleartext passwords or hashes. Test any recovered credentials only against approved login portals.

### Example commands

```bash
nslookup ns1.DOMAIN
nslookup ns2.DOMAIN
```

```text
filetype:pdf inurl:DOMAIN
intext:"@DOMAIN" inurl:DOMAIN
```

```bash
sudo python3 dehashed.py -q DOMAIN -p
```

Use `linkedin2username` to build a username list from a company's public profiles. Use a tool such as trufflehog or a storage search site to check public repositories and buckets.

## Internal recon without credentials

### Passive host discovery

Capture traffic on the internal segment and note the ARP and mDNS responses that reveal hosts.

```bash
sudo tcpdump -i INTERFACE
sudo responder -I INTERFACE -A
```

Responder in analyse mode (`-A`) listens for LLMNR and NBT-NS requests without answering them, so it is safe for passive discovery.

### Active host discovery

```bash
fping -asgq CIDR_RANGE
sudo nmap -v -A -iL hosts.txt -oN OUTPUT_FILE
```

Focus the nmap review on services that identify a DC and the domain: DNS, LDAP, Kerberos, and SMB.

### Username discovery

```bash
kerbrute userenum -d DOMAIN --dc DC_IP USERNAME_LIST -o valid_ad_users
```

Kerberos pre-authentication lets you test usernames without a failed logon event (4625), which makes this quieter than an SMB attempt. The username list can come from breach data or from a statistically likely username list.

## What to look for

- Domain controller hostnames, FSMO holders, and the exact domain name.
- Hosts with easy wins: exposed web admin panels, default credentials, or unpatched services.
- Usernames whose format matches the external findings.
- Shared local network segments that could expose LLMNR or NBT-NS traffic. See [LLMNR and NBT-NS Poisoning](/methodology/active-directory/llmnr-nbt-ns-poisoning/).

> Check the scope before any active step. Ports, subnets, and usernames outside the rules of engagement must not be tested.
{: .warning }

## Pitfalls

- Breach data is often stale. Validate each credential with one attempt, and log the result.
- Public metadata may reveal the username format but also internal hostnames. Record it, but do not publish it in a report without need.
- Port scans on a large range are noisy. Start with the DC services and expand only as needed.

## Defense

Reduce public exposure of staff data and document metadata. Remove stale staff from breach-exposed systems and rotate reused passwords. Restrict anonymous access to LDAP and SMB. See [Kerberos, DNS, LDAP, and MSRPC](/methodology/active-directory/kerberos-dns-ldap-msrpc/) for anonymous query behaviour, and [Target User Lists and Password Policies](/methodology/active-directory/target-user-lists-and-policies/) for the next step.
