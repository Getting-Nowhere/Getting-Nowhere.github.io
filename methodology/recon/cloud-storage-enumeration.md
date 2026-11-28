---
layout: page
title: "Cloud Storage Enumeration"
subtitle: "Identifying cloud-hosted storage and checking for exposed buckets and blobs"
permalink: /methodology/recon/cloud-storage-enumeration/
---

## Purpose

Organisations store files and host static sites in cloud object storage. Amazon S3 buckets, Azure blob containers, and Google Cloud Storage buckets are often used by mistake with public access enabled, and they can contain backups, documents, and source material. This page covers how to find the storage a target uses and check whether it is exposed.

## Where cloud storage shows up

- **DNS:** a subdomain or CNAME pointing to a provider's storage hostname. An IP lookup can reveal such a hostname, for example a static website endpoint for a regional S3 bucket.
- **Web content:** links in HTML, JavaScript, or CSS that reference storage URLs.
- **Search engines:** dork queries that target provider domains.
- **Third-party indexes:** public search services that catalogue exposed buckets and leaked keys.

Typical storage hostname patterns (replace the placeholders with the bucket or account name):

```text
BUCKET_NAME.s3.amazonaws.com
ACCOUNT_NAME.blob.core.windows.net
storage.googleapis.com/BUCKET_NAME
```

## Workflow

1. Add cloud hostnames found in DNS and IP lookups to the enumeration list.
2. Search for storage references with dork queries, for example `site:DOMAIN inurl:s3` or `intext:"blob.core.windows.net" DOMAIN`.
3. Look for the organisation's name, abbreviations, and product names as possible bucket or container names. Record the candidates and the evidence that links each one to the target.
4. Test whether the candidate is reachable and what permissions it allows. A listing response indicates public read access, a denial indicates protected storage, and an unknown name returns no resource.

```bash
curl -s https://BUCKET_NAME.s3.amazonaws.com/
```

5. Use third-party search services that index open storage and leaked secrets to find additional candidates. Treat their results as leads that need verification.

## What to look for

- Public listings that expose file names, which often reveal internal project names and document types.
- Backups, database dumps, and archives.
- Configuration and source files that contain keys or credentials.
- Static site buckets that serve internal or staging content.
- Repositories of keys, such as private SSH keys, found through public search services.

> Public read access to a bucket that holds sensitive data is a reportable finding. Do not download or open files beyond what is needed to confirm the exposure, and never use any credentials you find outside the agreed scope.
{: .danger }

## Pitfalls

- Bucket and container names are global or account-scoped, so a name match alone does not confirm ownership.
- A "denied" response means the resource exists but is protected. It is not a finding on its own.
- Third-party index results may be outdated. Re-check each candidate directly.

## Defense and prevention

- Enable the provider's block-public-access controls at the account level, and set them on every bucket and container that does not need public access.
- Use dedicated storage for public content and keep it separate from backups and internal data.
- Enable access logging and monitor for unexpected listings or downloads.
- Scan source repositories and public storage for secrets, and rotate any key that is exposed.
