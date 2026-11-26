---
title: "Phase 06 — Common Enterprise Applications"
date: 2026-11-26 17:44:00 +0530
categories: [CPTS, Applications]
tags: ["WEB"]
description: Recognize common products, verify exposure and assess product-specific configuration and authorization.
permalink: "/posts/cpts-phase-06-common-applications/"
toc: true
---

Recognize common products, verify exposure and assess product-specific configuration and authorization.

> Use this methodology only for systems and test identities within an explicitly authorized assessment. Validate the minimum necessary impact and preserve sanitized evidence.
{: .tip }

## Decision tree

```text
Product indicator
  |-- Uncertain identity -> corroborate with second indicator
  `-- Product confirmed -> core + component versions
       |-- Advisory match -> verify prerequisites and configuration
       |-- Admin surface -> compare assigned role with expected permissions
       `-- No supporting evidence -> record and continue
```

## Identify the product before selecting a product-specific check

```bash
nmap -p 80,443,8000,8080,8180,8888,10000 --open -oA web_discovery -iL scope_list
curl -s http://TARGET/ | grep -i WordPress
curl -s http://TARGET/ | grep -E 'themes|plugins'
```

If a site exposes a product name in its HTML, confirm using a second independent indicator such as asset paths, a version page or an authorized configuration inventory. Record the component version separately from the core version.

| Product | First observation | Next check |
|---|---|---|
| WordPress | Theme or plugin asset paths | Identify installed component and version; verify advisory prerequisites |
| Drupal | Core assets and module indicators | Module inventory and intended administrative routes |
| Joomla | Template or extension references | Core and extension versions separately |
| GitLab | Repository and sign-in interface | Compare intended project visibility with assigned role |
| Jenkins | Build dashboard | Role boundaries, job configuration permissions, credential references without secret values |
| Tomcat | Manager interface | Intended deployment and management permissions |
| Splunk / PRTG | Monitoring application | Management network, roles and application access |
| ColdFusion | Product paths or headers | Patch level and exposed administrative functionality |
| osTicket | Ticket portal | Compare ticket and attachment visibility across test roles |
| Thick client | Network requests or local configuration | Map backend endpoints and identify trust boundaries |

**If a product appears vulnerable:** verify the installed build, affected component, enabled feature and required role. If any prerequisite is unknown, park the lead; do not turn a scanner advisory into a confirmed finding.

**Study-note basis:** Application Discovery and Enumeration, WordPress Discovery and Enumeration, and the corresponding product discovery and attack chapters.

## Assessment workflow

### 1. Identify the actual product

Confirm the product with multiple indicators such as page structure, headers, known public resources and administrator inventory. Record edition, version, modules, plugins and deployment topology.

### 2. Review access and configuration

Identify management endpoints and compare intended public and restricted access. Review authentication policy, administrative roles, default-account handling, exposed configuration and integration permissions.

### 3. Assess version-dependent issues

Use vendor advisories and the exact build, enabled functionality and patch state. Distinguish vulnerable configurations from affected version ranges; avoid treating product presence as an exploitability guarantee.

### 4. Review integrations and client applications

Map the trust between the application, database, directory service, ticketing system and build or monitoring workers. For thick clients, review local configuration, update behavior and server-side enforcement.

### 5. Prioritize hardening

Maintain an accurate inventory, remove obsolete components, restrict management access, use strong authentication and least privilege, and monitor administrative changes.

## Decision checklist

| If you observe | Then check | Next action |
| --- | --- | --- |
| WordPress, Drupal or Joomla | Review core, themes, modules/plugins, users and update policy. | Assess public content versus administrative functions. |
| GitLab or Jenkins | Review repository visibility, CI/CD roles, worker isolation and administrative consoles. | Check who can modify builds, scripts and secrets policy. |
| osTicket | Review ticket access, attachment handling and administrative roles. | Use synthetic tickets for access comparisons. |
| PRTG or Splunk | Review monitoring interfaces, roles and integrations. | Check that data and management actions are appropriately restricted. |
| Tomcat, CGI or ColdFusion | Review deployment, runtime versions and management features. | Check applicable advisories and configuration. |
| IIS or directory-integrated application | Review short-name disclosure, LDAP filters and model binding. | See dedicated web control assessment. |
| Thick client | Review local permissions, configuration, network requests and backend authorization. | Compare role-specific behavior with the server policy. |

## Common mistakes and missed checks

- Ignoring plugins, modules, edition differences and patch backports.
- Assuming a management console implies administrator access.
- Testing a product-specific weakness without confirming its prerequisites.

## When to stop and reassess

Do not deploy executable content or alter production application configuration to prove an issue.

## Expected deliverable

A product inventory, confirmed configuration findings, relevant advisories and recommended hardening.

## Related methodology

- [Complete penetration testing methodology]({{ '/posts/cpts-methodology/' | relative_url }})
- [Phase 07 — Credentials, Authentication and Access Assessment]({{ '/posts/cpts-phase-07-authentication/' | relative_url }})
- [Phase 05 — Web Application Vulnerability Assessment]({{ '/posts/cpts-phase-05-web-vulnerabilities/' | relative_url }})

## Study basis

Adapted from CPTS study topics: Attacking Common Applications: CMS, Engineering, Monitoring, Servlet Containers, CGI, Thick Clients and Prevention. The sequencing and validation criteria are an editorial synthesis for a public assessment reference.
