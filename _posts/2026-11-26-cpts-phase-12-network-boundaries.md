---
title: "Phase 12 — Network Segmentation and Lateral Access Assessment"
date: 2026-11-26 17:38:00 +0530
categories: [CPTS, Network Assessment]
tags: ["ENUMERATION"]
description: Evaluate internal reachability, routing, management boundaries and approved access between network segments.
permalink: "/posts/cpts-phase-12-network-boundaries/"
toc: true
---

Evaluate internal reachability, routing, management boundaries and approved access between network segments.

> Use this methodology only for systems and test identities within an explicitly authorized assessment. Validate the minimum necessary impact and preserve sanitized evidence.
{: .tip }

## Decision tree

```text
Additional route or interface
  |-- Scope not confirmed -> stop at inventory
  `-- Scope confirmed -> map expected access policy
       |-- Reachability differs from policy -> validate from approved vantage
       `-- Reachability matches policy -> record coverage
```

## Build the topology from each approved vantage point

```bash
ip a
ip route
arp -a
ss -tulnp
```

```cmd
ipconfig /all
route print
arp -a
netstat -ano
```

Record source interface, gateway, destination subnet, listener address and observed service. A loopback listener, a connected route and an accessible remote service are three different observations.

| Observation | Check next |
|---|---|
| Second interface | Network ownership and whether the subnet is in scope |
| Route via gateway | Intended permitted destinations and filtering |
| Local-only service | Owning process and intended management boundary |
| Remote management port | Approved source network and identity requirements |
| Different reachability from two approved vantage points | Compare expected segmentation rule to observed results |

The original pivoting notes distinguish local, remote and dynamic forwarding, SOCKS proxies, RDP-based access, Windows forwarding and other tunnels. Choose the method only after the authorized route and testing objectives are established; this public guide does not reproduce covert tunnel or bypass instructions.

**Study-note basis:** Introduction, Networking Behind Pivoting, Dynamic Port Forwarding with SSH and SOCKS Tunneling, Remote or Reverse Port Forwarding, Port Forwarding with Netsh.

## Assessment workflow

### 1. Map the network from approved vantage points

Record interfaces, routes, gateways, network segments and expected trust boundaries. Identify which hosts and services are accessible from each approved location.

### 2. Evaluate segmentation

Compare the intended allow/deny matrix with observed reachability. Distinguish a blocked port, name-resolution failure, unavailable route and application authentication failure.

### 3. Review forwarding and tunneling exposure

Understand local, remote and dynamic forwarding, SOCKS proxies and multi-hop routes as different network patterns. Review which administrative roles may establish them, where listeners bind and whether monitoring and egress restrictions cover them.

### 4. Assess lateral authentication policy

Review whether separate services and hosts require appropriately scoped credentials. Assess NTLM, Kerberos and certificate-based access policies using configuration and approved test accounts, not replay of stolen authentication material.

### 5. Track and close approved test paths

Record authorized connectivity tests with source/destination, port, account context, result and timestamp. Remove any temporary routes or approved test configurations during closeout.

## Decision checklist

| If you observe | Then check | Next action |
| --- | --- | --- |
| Service works from one segment but not another | Compare expected firewall and routing policy. | Determine whether the observed separation is intentional. |
| Host is reachable but login fails | Review the account, protocol and authorization policy. | Do not confuse network access with identity access. |
| Forwarding or proxy capability exists | Review authorization, bind addresses and egress controls. | Assess whether unauthorized bridging is prevented. |
| An internal resource is discovered outside scope | Record metadata without active testing. | Request scope approval if necessary. |

## Read-only reference commands

Examples use an approved environment. Replace placeholders with authorized lab values. Commands are reference examples, not an instruction to run them against arbitrary hosts.

```bash
# Linux: inspect network context
ip addr
ip route
ss -lnt

# Windows: inspect network context
ipconfig /all
route print
netstat -ano
```

## Common mistakes and missed checks

- Assuming a proxy supports every protocol or scan mode.
- Overlooking DNS resolution differences between segments.
- Conflating network reachability with privilege or administrative access.

## When to stop and reassess

Do not establish hidden tunnels, bypass segmentation or connect to out-of-scope networks.

## Expected deliverable

A reachability and segmentation matrix, verified access boundaries and prioritized network-control findings.

## Related methodology

- [Complete penetration testing methodology]({{ '/posts/cpts-methodology/' | relative_url }})
- [Phase 13 — Validation, Reporting and Closeout]({{ '/posts/cpts-phase-13-reporting/' | relative_url }})

## Study basis

Adapted from CPTS study topics: Pivoting, Tunneling and Port Forwarding; Password Attacks: Windows Lateral Movement. The sequencing and validation criteria are an editorial synthesis for a public assessment reference.
