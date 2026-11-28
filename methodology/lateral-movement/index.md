---
layout: page
title: "Lateral Movement"
subtitle: "Reusing captured hashes, Kerberos tickets and certificates to reach further hosts"
permalink: /methodology/lateral-movement/
---

Lateral movement begins once you hold material that belongs to a second account or machine: an NTLM hash, a Kerberos ticket, a keytab or a certificate. The goal is to reach another host or service as that identity without knowing its plaintext password. Each technique below answers a different question: which credential you have, which protocol the target accepts and what you need to prepare first. Work through the checklist for every new credential, and record where it came from and which systems it opened.

> Placeholders used on these pages: TARGET_IP, DC_IP, DOMAIN, USERNAME, PASSWORD, NTLM_HASH, AES256_KEY, TICKET_B64, KIRBI_FILE and CCACHE_FILE. Substitute real values only inside the agreed scope, and never copy recovered secrets into a report.
{: .info }

## Choosing a technique

| Material you hold | Typical next step | Page |
|---|---|---|
| NTLM hash, or an AES or RC4 key | Authenticate over SMB, WMI, WinRM or RDP without the password | [Pass the Hash](/methodology/lateral-movement/pass-the-hash/) |
| Kerberos ticket exported from a Windows host | Inject the ticket, or forge a TGT from a key | [Pass the Ticket from Windows](/methodology/lateral-movement/pass-the-ticket-windows/) |
| ccache file, keytab or a Linux host joined to AD | Import the ticket or key into your session and use Kerberos tools | [Pass the Ticket from Linux](/methodology/lateral-movement/pass-the-ticket-linux/) |
| X.509 certificate, or write access to a key credential | Request a TGT with PKINIT | [Pass the Certificate](/methodology/lateral-movement/pass-the-certificate/) |

## Checklist

- ☐ Confirm that every host and account you plan to use is within the agreed scope.
- ☐ Identify the material you hold: NTLM hash, AES or RC4 key, ticket, keytab, ccache file or certificate.
- ☐ Check which remote services are reachable on the target: SMB, WMI, WinRM or RDP.
- ☐ Establish whether the account is a local or a domain account, and include the domain where one is needed.
- ☐ Check the target's remote-admin restrictions (UAC token filtering and Restricted Admin) before choosing a method.
- ☐ Prefer read-only proof of access, such as `whoami`, `hostname` or listing a share.
- ☐ Record the source of each credential, every target reached and the evidence captured.
- ☐ Revert any change made during the movement, such as a registry edit or an added key credential, and note it in the report.

## Technique pages

- [Pass the Hash](/methodology/lateral-movement/pass-the-hash/)
- [Pass the Ticket from Windows](/methodology/lateral-movement/pass-the-ticket-windows/)
- [Pass the Ticket from Linux](/methodology/lateral-movement/pass-the-ticket-linux/)
- [Pass the Certificate](/methodology/lateral-movement/pass-the-certificate/)
