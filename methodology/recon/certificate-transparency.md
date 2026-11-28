---
layout: page
title: "Certificate Transparency"
subtitle: "Passive subdomain discovery from public TLS certificate logs"
permalink: /methodology/recon/certificate-transparency/
---

## Purpose

Certificate transparency (CT) logs record TLS certificates that certificate authorities issue. The logs are public so that anyone can audit which certificates exist for a domain. Because certificates list the hostnames they cover in their Subject Alternative Name (SAN) field, the logs are a passive source of subdomains. crt.sh is a widely used search interface over these logs.

This is one of the best starting points for subdomain discovery because querying it does not touch the target's systems.

## Workflow

1. Query crt.sh for the domain and request JSON output.

```bash
curl -s "https://crt.sh/?q=DOMAIN&output=json" | jq .
```

2. Extract unique hostnames from the certificate names.

```bash
curl -s "https://crt.sh/?q=DOMAIN&output=json" | jq . | grep name | cut -d":" -f2 | grep -v "CN=" | cut -d'"' -f2 | awk '{gsub(/\\n/,"\n");}1;' | sort -u
```

3. Remove wildcard entries (such as `*.DOMAIN`) from the list of hosts to resolve, but keep the wildcard as evidence that a wildcard certificate is in use.

4. Resolve the remaining names to IP addresses. This turns a list of names into infrastructure you can assess.

```bash
for i in $(cat SUBDOMAIN_LIST); do host "$i" | grep "has address" | cut -d" " -f1,4; done
```

5. Compare the CT list with brute-force and zone transfer results. Names that appear only in CT logs may be retired systems or may have been removed from DNS.

## Reading the results

Each CT entry includes the issuing authority, the common name, the name values, and the validity period. Pay attention to:

- **Names not linked from the site:** staging, internal, and admin hostnames.
- **Old certificates:** expired entries show hosts that existed in the past and may still run.
- **Multiple issuers over time:** can indicate infrastructure changes or migrations.

> Because CT logs are historical, a name appearing here does not confirm that the host is live. Always resolve and probe the host before reporting it as an active asset.
{: .tip }

## Pitfalls

- The JSON output format and parsing pipeline can change. Validate the extracted list by counting entries and spot-checking several names.
- Services sometimes return errors or empty results under load. Retry with a short delay rather than concluding there are no certificates.
- Wildcard certificates hide the individual names they cover, so CT logs will not reveal every subdomain under a wildcard.

## Defense and prevention

- Treat every hostname placed in a certificate as public. Do not list internal or sensitive names in SAN fields of publicly trusted certificates.
- Monitor CT logs for certificates issued for your domains, which can reveal unauthorised issuance or new services.
- Retire certificates and DNS records for decommissioned hosts.
