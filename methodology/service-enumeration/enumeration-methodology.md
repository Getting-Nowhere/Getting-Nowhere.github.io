---
layout: page
title: "Enumeration Methodology"
subtitle: "The layered model, guiding questions and principles behind every service check"
permalink: /methodology/service-enumeration/enumeration-methodology/
---

## Purpose

Enumeration is the disciplined process of finding out what a target exposes, why it exposes it, and what that exposure makes possible. This page sets out the model used across this section. Every service page assumes that the reader has placed a finding within the layers below before deciding what to do with it.

## Three types of enumeration

1. **Infrastructure-based enumeration** covers the internet presence of an organisation and the gateways that protect it.
2. **Host-based enumeration** covers the services running on individual systems, such as the pages in this section.
3. **OS-based enumeration** covers processes, privileges and the way the operating system is set up.

## The six layers

| Layer | Goal | Examples of what to gather |
| --- | --- | --- |
| 1. Internet presence | Identify every system and interface that can be tested | Domains, subdomains, vhosts, ASNs, IP addresses, cloud instances |
| 2. Gateway | Understand the protections and what to watch out for | Firewalls, DMZ, IDS/IPS, EDR, proxies, VPN |
| 3. Accessible services | Understand the purpose of each service and how to communicate with it | Service type, configuration, port, version, interface |
| 4. Processes | Identify dependencies between internal processes | PID, data processed, scheduled tasks, sources and destinations |
| 5. Privileges | Determine what is and is not possible with a given identity | Groups, users, permissions |
| 6. OS setup | See how administrators manage systems and what internal detail leaks | OS type, patch level, network configuration, configuration files |

Each layer feeds the next. A service found in layer 3 is only useful once its privileges (layer 5) and configuration (layer 6) are understood.

## Guiding questions

Ask these of every observation:

- What can we see?
- What reasons could there be for seeing it?
- What picture does what we see create?
- What do we gain from it?
- How can we use it?
- What can we not see?
- What reasons could there be for not seeing it?
- What picture results from what we do not see?

## Principles

| No. | Principle |
| --- | --- |
| 1 | There is more than meets the eye. Consider all points of view. |
| 2 | Distinguish between what we see and what we do not see. |
| 3 | There are always ways to gain more information. Understand the target. |

> A closed port or a refused connection is a result, not a conclusion. Test the same service from another vantage point, with another protocol or with authentication before deciding that it is unavailable.
{: .info }

## Applying the model

1. **Map the surface.** Start at layer 1 and list every host, domain and interface in scope.
2. **Classify the gateway.** Identify what sits in front of each host. Note which ports are filtered and which are reachable.
3. **Profile each service.** For each open port, confirm the service, version and configuration. Use the service pages in this section.
4. **Link services to identities.** Determine which accounts, groups and permissions each service uses, and what those permit.
5. **Review system setup.** Where access allows, examine configuration files, patch levels and internal naming.
6. **Record and revisit.** Each new fact can reopen an earlier layer. A version number may change which service page applies, and a discovered credential may change what is reachable.

## Note template

Use a consistent record for every observation so that the chain of reasoning can be reviewed later.

```text
Service:
Host, port and version:
Source of the information (tool, command, file):
What it reveals:
Can it be used? (yes / no / needs follow-up):
Layer (1 to 6):
Next step:
What remains unknown and why:
```

## What to look for

- Services that disagree with each other, for example a version banner that does not match the observed behaviour.
- Information that is visible only to authenticated users, which suggests a path to more access.
- Trust relationships between hosts, accounts or services.
- Internal naming, addressing or software versions disclosed to unauthenticated clients.

## Pitfalls

- Tool output is a hypothesis. Verify scanner findings by interacting with the service directly.
- Enumeration can generate large volumes of traffic and failed logins. Agree on rate limits and lockout thresholds before starting.
- Skipping a layer because it looks unimportant often removes the context needed to interpret later findings.
- Documentation of what was not visible is as important as documentation of what was.

## Defense and prevention

Defenders can use the same six layers to audit their own exposure: inventory the internet-facing footprint, confirm that gateways filter what they should, minimise the services each host offers, apply least privilege to accounts and review configuration files for disclosed detail.
