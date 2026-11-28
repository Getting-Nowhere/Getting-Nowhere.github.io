---
layout: page
title: "The .well-known Directory"
subtitle: "Reading standard metadata endpoints such as security.txt and OpenID configuration"
permalink: /methodology/recon/well-known-uris/
---

## Purpose

The `/.well-known/` path is a standard location under the web root for metadata that applications and security tools need to discover. Because the locations are standardised, you can request them without guessing. They often disclose contact details, identity configuration, and integration endpoints.

## Common URIs

| URI suffix | Purpose | Status |
|---|---|---|
| `security.txt` | Contact details for reporting vulnerabilities (RFC 9116) | Permanent |
| `change-password` | Standard URL for a password change page | Provisional |
| `openid-configuration` | OpenID Connect discovery document | Permanent |
| `assetlinks.json` | Verifies ownership of apps associated with a domain | Permanent |
| `mta-sts.txt` | SMTP MTA Strict Transport Security policy (RFC 8461) | Permanent |

## Workflow

1. Request `security.txt` for contact points and the disclosure policy.

```bash
curl -s https://DOMAIN/.well-known/security.txt
```

2. Request the OpenID Connect discovery document. Pipe it through `jq` for readable output.

```bash
curl -s https://DOMAIN/.well-known/openid-configuration | jq .
```

3. Request the remaining URIs that apply to the target, such as `mta-sts.txt` for mail policy and `assetlinks.json` for linked applications.

4. Record every endpoint returned and its response code. A 404 is still useful: it confirms the site does not use that standard.

## Reading the OpenID configuration

OpenID Connect is an identity layer built on OAuth 2.0. The discovery document describes how the identity provider works. A typical document looks like this:

```json
{
  "issuer": "https://DOMAIN",
  "authorization_endpoint": "https://DOMAIN/oauth2/authorize",
  "token_endpoint": "https://DOMAIN/oauth2/token",
  "userinfo_endpoint": "https://DOMAIN/oauth2/userinfo",
  "jwks_uri": "https://DOMAIN/oauth2/jwks",
  "response_types_supported": ["code", "token", "id_token"],
  "subject_types_supported": ["public"],
  "id_token_signing_alg_values_supported": ["RS256"],
  "scopes_supported": ["openid", "profile", "email"]
}
```

Key fields to extract:

- **Endpoints:** authorization, token, and userinfo URLs define the authentication surface.
- **`jwks_uri`:** the JSON Web Key Set contains the public keys used to verify tokens. It identifies the key material in use.
- **Supported scopes and response types:** show what the integration can request and how tokens are issued.
- **Signing algorithms:** indicate the token signing approach. Look for weak or unexpected algorithms.

## What to look for

- Identity endpoints hosted on a different domain or provider, which shows where authentication is delegated.
- Response types such as `token` alongside `code` that may enable implicit-flow patterns, to be checked against current guidance.
- Contact details in `security.txt` that point to a bug bounty or disclosure program, which also marks an authorised reporting route.
- Endpoints that return an error rather than a 404, which can indicate that the service exists but is restricted.

> The discovery document is public by design. Its value is in mapping the authentication surface, which then feeds targeted testing of the listed endpoints within scope.
{: .tip }

## Pitfalls

- Some sites redirect `.well-known` requests to a generic page. Check the content type and body, not only the status code.
- A missing `security.txt` does not mean the site has no disclosure process. Check the organisation's website for a vulnerability disclosure page.
- The discovery document may describe a provider that is shared across several applications. Scope testing to the target's own tenant.

## Defense and prevention

- Publish `security.txt` with accurate, monitored contact details and an expiry date.
- Restrict the discovery document to supported configurations and remove unused response types.
- Rotate signing keys on a schedule and retire old keys from the JWKS.
