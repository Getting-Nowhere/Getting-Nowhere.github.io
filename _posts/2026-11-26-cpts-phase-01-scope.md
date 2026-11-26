---
title: "Phase 01 — Scope, Preparation and Assessment Planning"
date: 2026-11-26 17:59:00 +0530
categories: [CPTS, Methodology]
tags: ["ENUMERATION"]
description: Establish the rules, evidence standards and initial target inventory before testing.
permalink: "/posts/cpts-phase-01-scope/"
toc: true
---

Establish the rules, evidence standards and initial target inventory before testing.

> Use this methodology only for systems and test identities within an explicitly authorized assessment. Validate the minimum necessary impact and preserve sanitized evidence.
{: .tip }

## Start with a working inventory

| Record | Required values |
|---|---|
| Scope | Approved IP ranges, domains and exclusions |
| Access | Issued test roles and permitted vantage points |
| Constraints | Request budgets, maintenance windows, disruptive actions requiring approval |
| Evidence | Output path, timestamp, source identity and redaction policy |
| Leads | Asset, observation, prerequisite, status, next action |

If a new hostname or subnet appears, verify scope before adding it. If a test needs a state change, establish the rollback procedure first. Mark each lead `confirmed`, `parked`, `inconclusive`, `not tested` or `out of scope`. The tracker and these operational gates are editorial organization of the enumeration principles in the notes.

## Assessment workflow

### 1. Establish authorization

Define the permitted assets, addresses, accounts, test windows and excluded techniques. Record who can approve a change in scope. Separate production assets from disposable lab systems.

### 2. Prepare the assessment workspace

Create a target inventory and evidence folders. Record the network location, VPN or lab connectivity, available tools, timestamps and any supplied test accounts. Verify that the testing environment resolves the intended targets.

### 3. Apply the enumeration model

Work through internet presence, gateways, services, processes, privileges and operating-system configuration. At each layer ask what is visible, why it is visible, what is not visible and whether the absence is meaningful.

### 4. Define validation standards

Distinguish an observation from a hypothesis and a confirmed finding. Prefer the minimum evidence required to demonstrate a security boundary failure. Set limits for account testing, resource consumption and changes to systems.

## Decision checklist

| If you observe | Then check | Next action |
| --- | --- | --- |
| Only an IP address or subnet is supplied | Confirm scope and start host discovery. | Phase 02: identify reachable hosts and services. |
| A web application is supplied | Record its canonical hostname and entry points. | Phase 04: map routes, roles and inputs. |
| An account or host access is supplied | Document its intended privileges and access restrictions. | Phases 07–11: establish a baseline before testing. |
| A newly discovered asset lies outside the agreed scope | Record the relationship without contacting it. | Obtain explicit authorization before expanding the inventory. |

## Common mistakes and missed checks

- Treating every visible system as authorized.
- Recording only successful tests instead of coverage and errors.
- Beginning with a specific tool rather than a question about the target.

## When to stop and reassess

Do not start active testing until scope and applicable limits are established.

## Expected deliverable

A scoped inventory, rules of engagement, initial access baseline and evidence plan.

## Related methodology

- [Complete penetration testing methodology]({{ '/posts/cpts-methodology/' | relative_url }})
- [Phase 02 — External Reconnaissance and Network Discovery]({{ '/posts/cpts-phase-02-reconnaissance/' | relative_url }})

## Study basis

Adapted from CPTS study topics: Getting Started; Footprinting: Enumeration Methodology. The sequencing and validation criteria are an editorial synthesis for a public assessment reference.
