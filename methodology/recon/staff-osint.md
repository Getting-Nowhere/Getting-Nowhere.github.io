---
layout: page
title: "Staff and Technology OSINT"
subtitle: "Turning public profiles, job postings, and code into a technology and people map"
permalink: /methodology/recon/staff-osint/
---

## Purpose

People reveal the organisation's technology through their public profiles, job postings, conference talks, and code. Staff enumeration identifies roles, skills, and technology stacks, and it supports social engineering assessments within the agreed scope. The output is intelligence about which technologies are in use and who works with them, which then guides targeted testing.

Only collect information that is publicly available and within the engagement's rules. Do not access private accounts, impersonate staff, or store personal data beyond what the report requires.

## Sources

| Source | What it reveals |
|---|---|
| Professional networking sites | Roles, tenure, skills, and reporting structure |
| Job postings | Technologies, frameworks, and internal tools the organisation uses |
| Public code repositories | Projects, dependencies, configuration patterns, and sometimes secrets |
| Personal websites and CVs | Project history and technology experience |
| Conference talks and blog posts | Architecture details and internal tooling |
| Email addresses from the site or WHOIS | Naming format, which supports identifying other accounts |

## Workflow

1. Identify the roles most relevant to the assessment, such as developers, system administrators, and IT support.
2. Review job postings for the target organisation. Note the languages, frameworks, cloud platforms, and security tools named. These are often the most accurate current inventory of the stack.
3. Match technologies to known weaknesses. For example, a posting for a specific web framework suggests checking that framework's common misconfigurations and published vulnerabilities for the version in use.
4. Search public code repositories for the organisation's name, domain, and staff names. Look for project names, dependency files, and configuration patterns.
5. Infer the email address format from known examples, such as the address on a public contact page. Use the format only to check that the pattern matches, not to contact individuals.
6. Record each technology with the source it came from, the date seen, and the confidence level.

## Example reasoning

A candidate's public CV lists a set of languages and a web framework, and links to a public code repository. The framework identifies a set of common misconfigurations and version-specific issues to check, and the repository shows project structure and dependency files. Each piece is a lead to verify on the target, not a finding in itself.

## What to look for

- Technologies named in several sources, which are more likely to be in production.
- Outdated or end-of-life frameworks named in job postings or repositories.
- Public repositories with configuration files, `.env` files, or committed keys.
- Internal tool names, hostnames, or architecture details disclosed in talks or posts.

> Public repositories sometimes contain committed secrets. Report any secret you find, do not use it, and recommend immediate rotation.
{: .danger }

## Pitfalls

- Public information can be outdated or belong to a different organisation with a similar name. Verify each link to the target.
- Job postings describe intended technology, not necessarily what is deployed.
- Personal data is subject to privacy law. Minimise what you collect and avoid publishing individual details in the report.

## Defense and prevention

- Train staff to limit detail about internal systems in public profiles, CVs, and talks.
- Keep job postings general about internal infrastructure, and avoid listing exact versions.
- Use organisation-level policies to prevent committing secrets to public repositories, and scan commits for credentials.
- Use role-based contact addresses on public pages to reduce the value of the address format.
