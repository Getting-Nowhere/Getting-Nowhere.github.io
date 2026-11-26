---
title: "Penetration Testing Methodology: From Reconnaissance to Reporting"
date: 2026-11-26 18:00:00 +0530
categories: [CPTS, Methodology]
tags: ["ENUMERATION", "PRIVILEGE ESCALATION", "WEB"]
description: A complete, evidence-led CPTS assessment lifecycle with phase-specific decision guides and web vulnerability playbooks.
permalink: "/posts/cpts-methodology/"
toc: true
featured: true
badge: "METHODOLOGY"
---

A structured, end-to-end reference for conducting authorized penetration tests, developed from CPTS study material. The methodology follows an evidence-led lifecycle: establish scope, discover assets, enumerate services, assess security boundaries, validate findings and report actionable remediation.

> This guide is intended for authorized security assessments and controlled training environments. The examples use placeholders and synthetic data; it is not a collection of live-target walkthroughs or exploit payloads.
{: .tip }

## Start here: choose the next page from evidence

```text
Approved scope
  -> Host and port inventory
     -> Protocol identified: service enumeration
     -> HTTP identified: web discovery -> matching vulnerability page
     -> Product identified: common applications
     -> Authorized identity: authentication / access assessment
     -> Authorized Linux session: Linux privilege checks
     -> Authorized Windows session: Windows privilege checks
     -> Domain indicators: AD enumeration
     -> Additional routes: segmentation assessment (scope gate)
  -> Validate -> document -> clean up -> retest
```

At every transition, record the observation and the one next check that would confirm or reject the lead. If there is no concrete next check, park it and return to the inventory. Use the linked phase pages for the commands and detailed decision tables, not this index alone.

## Assessment lifecycle

Start with preparation, then work through the relevant phases. They form a repeatable cycle rather than a rigid one-way sequence. New authorized access or new infrastructure evidence may require returning to discovery and enumeration.

| Phase | Objective |
| --- | --- |
| [Phase 01 — Scope, Preparation and Assessment Planning](/posts/cpts-phase-01-scope/) | Establish the rules, evidence standards and initial target inventory before testing. |
| [Phase 02 — External Reconnaissance and Network Discovery](/posts/cpts-phase-02-reconnaissance/) | Build a reliable asset and service inventory using infrastructure discovery and Nmap. |
| [Phase 03 — Service Enumeration and Infrastructure Assessment](/posts/cpts-phase-03-services/) | Investigate each discovered protocol and establish its authentication and authorization boundaries. |
| [Phase 04 — Web Discovery, Fuzzing and Request Analysis](/posts/cpts-phase-04-web-discovery/) | Map applications, request inputs, roles, and response behavior before vulnerability testing. |
| [Phase 05 — Web Application Vulnerability Assessment](/posts/cpts-phase-05-web-vulnerabilities/) | Select a dedicated validation workflow based on the observed input and security boundary. |
| [Phase 06 — Common Enterprise Applications](/posts/cpts-phase-06-common-applications/) | Recognize common products, verify exposure and assess product-specific configuration and authorization. |
| [Phase 07 — Credentials, Authentication and Access Assessment](/posts/cpts-phase-07-authentication/) | Review account protections, credential-handling practices and the scope of approved test identities. |
| [Phase 08 — Authorized Host Access and Session Assessment](/posts/cpts-phase-08-host-access/) | Establish reliable host and session context; document permitted transfer and execution boundaries. |
| [Phase 09 — Linux Privilege Escalation Assessment](/posts/cpts-phase-09-linux-privileges/) | Evaluate Linux identity, delegated privileges, file permissions, privileged execution and host isolation. |
| [Phase 10 — Windows Privilege Escalation Assessment](/posts/cpts-phase-10-windows-privileges/) | Review Windows tokens, groups, service permissions, scheduled tasks, OS controls and patch context. |
| [Phase 11 — Active Directory Assessment](/posts/cpts-phase-11-active-directory/) | Map directory structure, authentication, accounts, delegated rights, GPOs and trust boundaries. |
| [Phase 12 — Network Segmentation and Lateral Access Assessment](/posts/cpts-phase-12-network-boundaries/) | Evaluate internal reachability, routing, management boundaries and approved access between network segments. |
| [Phase 13 — Validation, Reporting and Closeout](/posts/cpts-phase-13-reporting/) | Turn observations into reproducible findings, verify remediation and complete the assessment responsibly. |

## Choose the appropriate next phase

| Current situation | Next action |
| --- | --- |
| No target inventory | Establish authorization, then discover assets. |
| Open ports and services identified | Build a protocol-specific inventory and establish expected access. |
| Web application identified | Map routes, inputs, roles and baseline responses. |
| Suspicious application behavior | Choose the matching vulnerability assessment; validate with synthetic data. |
| Approved account or session available | Confirm role, effective permissions and accessible services. |
| Linux or Windows host access | Assess local privilege configuration and system boundaries. |
| Domain indicators identified | Map directory structure, identities, ACLs, policy and trusts. |
| Additional network segment identified | Confirm scope and evaluate reachability and segmentation. |
| Confirmed finding or completed coverage | Record evidence, remediation, limitations and closeout. |

## Web vulnerability assessment playbooks

Select an individual page based on the actual request behavior and trust boundary. The SQL injection page includes SQLMap considerations; each other family remains separate.

- [Web Assessment — Cross-Site Scripting (XSS)]({{ '/posts/cpts-web-xss/' | relative_url }})
- [Web Assessment — SQL Injection and SQLMap]({{ '/posts/cpts-web-sqli/' | relative_url }})
- [Web Assessment — OS Command Injection]({{ '/posts/cpts-web-command-injection/' | relative_url }})
- [Web Assessment — File Inclusion and Path Handling]({{ '/posts/cpts-web-file-inclusion/' | relative_url }})
- [Web Assessment — File Upload Security]({{ '/posts/cpts-web-file-upload/' | relative_url }})
- [Web Assessment — Insecure Direct Object References (IDOR)]({{ '/posts/cpts-web-idor/' | relative_url }})
- [Web Assessment — XML External Entity (XXE) Handling]({{ '/posts/cpts-web-xxe/' | relative_url }})
- [Web Assessment — HTTP Verb Tampering]({{ '/posts/cpts-web-verb-tampering/' | relative_url }})
- [Web Assessment — Login and Account Protection]({{ '/posts/cpts-web-authentication/' | relative_url }})
- [Web Assessment — LDAP Injection and Mass Assignment]({{ '/posts/cpts-web-additional/' | relative_url }})

## Prioritization principles

- Prioritize reliable observations and simple configuration or authorization weaknesses before version-dependent hypotheses.
- Record the expected behavior, actual behavior and identity for each test. Change one variable at a time.
- Do not confuse an exposed service, a version match or a tool-reported edge with a confirmed vulnerability.
- Use the smallest reproducible proof and avoid unnecessary data collection or modification.
- If a prerequisite is missing, classify the lead as parked or inconclusive and return to enumeration.

## Coverage and evidence tracker

| Field | Record |
| --- | --- |
| Asset and scope | Hostname, address, application and authorization reference. |
| Context | Account/role, network vantage, relevant request or command. |
| Observation | Sanitized raw evidence and expected behavior. |
| Status | Confirmed / not observed / inconclusive / not tested / out of scope. |
| Next action | One concrete verification step, remediation or reason to stop. |
| Retest | Date, expected result and observed result. |

## Study basis and editorial approach

The technical topics follow the CPTS study material on footprinting, Nmap, web information gathering, web attacks, common applications and services, password assessment, shells and file transfers, Linux and Windows privilege escalation, Active Directory and pivoting. The lifecycle, prioritization, evidence tracking and reporting structure are editorial additions. This public edition deliberately uses sanitized examples and does not reproduce private lab credentials, flags, walkthroughs or operational exploit chains.
