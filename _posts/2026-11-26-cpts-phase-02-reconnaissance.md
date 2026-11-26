---
title: "Phase 02 — External Reconnaissance and Network Discovery"
date: 2026-11-26 17:58:00 +0530
categories: [CPTS, Enumeration]
tags: ["ENUMERATION"]
description: Build a reliable asset and service inventory using infrastructure discovery and Nmap.
permalink: "/posts/cpts-phase-02-reconnaissance/"
toc: true
---

Build a reliable asset and service inventory using infrastructure discovery and Nmap.

> Use this methodology only for systems and test identities within an explicitly authorized assessment. Validate the minimum necessary impact and preserve sanitized evidence.
{: .tip }

## Decision tree

```text
Known in-scope target
  |-- Host responds -> TCP inventory -> version identification
  |-- No response -> check route and discovery reason -> classify uncertainty
  `-- TCP inventory complete -> relevant UDP inventory
       |-- HTTP -> web discovery
       |-- AD indicators -> directory assessment
       `-- Other protocol -> service-specific page
```

## Field workflow: from host discovery to a service inventory

### 1. Discover hosts and preserve the result

```bash
sudo nmap -sn -oA discovery TARGET_SUBNET
sudo nmap -sn -oA discovery-list -iL hosts.lst
```

If the host list is unexpectedly empty, inspect the discovery reason rather than immediately assuming the subnet is unused.

```bash
sudo nmap -sn -PE --reason TARGET_IP
```

### 2. Establish port state before version detection

```bash
sudo nmap -sS --top-ports=10 TARGET_IP
sudo nmap -sS -p- -oA tcp-all TARGET_IP
sudo nmap -sV -p PORT_LIST -oA services TARGET_IP
sudo nmap -sU -F -oA udp-common TARGET_IP
```

`-sS` needs raw-packet privileges. A connect scan (`-sT`) is an alternative where those privileges are unavailable. Keep discovery, full port inventory and targeted version detection separate so results can be compared.

### 3. Understand unexpected results

```bash
sudo nmap -sT -p PORT --reason --packet-trace TARGET_IP
```

| Observation | Interpretation | Next check |
|---|---|---|
| SYN/ACK | Listening TCP port | Identify protocol and version |
| RST | Closed TCP port | Record; investigate only if expected open |
| No reply or relevant ICMP error | Filtering is possible | Review route and filtering with owner |
| UDP `open\|filtered` | No definitive response | Use a protocol-specific query |
| Unknown version | Fingerprint is incomplete | Inspect banner and protocol behavior |

### 4. Correlate names and addresses

```bash
dig DOMAIN
dig NS DOMAIN
host HOSTNAME
curl -s 'https://crt.sh/?q=DOMAIN&output=json' | jq .
```

Certificate transparency records may be historical; resolve each discovered name and verify scope before adding it to the target list. An address used by a shared provider is not necessarily authorized.

**Decision gate:** If HTTP is present, continue to web discovery; if SMB, LDAP and Kerberos coexist, establish domain context; otherwise use the protocol-specific checklist. Do not abandon service enumeration after finding the first interesting port.

**Study-note basis:** All commands/NMAP, Footprinting, Host Enumeration, Digging DNS.

## Assessment workflow

### 1. Identify internet-facing infrastructure

Review authorized domain registration, DNS records, subdomains, virtual hosts and publicly documented infrastructure. Correlate names, addresses and ownership instead of assuming every related record is in scope.

### 2. Discover hosts

Use an approved target list or subnet. A failed ICMP response does not prove a host is absent; compare with routing, ARP on a local segment and known service responses.

### 3. Identify listening ports

Perform an initial TCP inventory, followed by a complete TCP assessment where permitted. Include relevant UDP services and unusual port numbers. Adjust scan intensity to the environment rather than applying a fixed lab rate.

### 4. Fingerprint and reconcile

Run service identification against observed open ports. Record the version confidence, protocol, hostname and certificate information. An open port is not proof of the expected service; a filtered result is not proof of a closed port.

### 5. Preserve results

Save output and associate each result with the target, source interface, scan date and configuration. Update the inventory whenever new hosts become authorized.

## Decision checklist

| If you observe | Then check | Next action |
| --- | --- | --- |
| A host responds but a port is filtered | Record the observed state and verify route and firewall context. | Compare with approved vantage points; do not attempt to defeat controls. |
| HTTP or HTTPS is present | Record the scheme, port, certificate and hostname. | Phase 04. |
| SMB, LDAP, Kerberos or RPC appear together | Identify whether the host is a domain controller or member server. | Phase 03 and Phase 11. |
| UDP service is possible | Verify with an appropriate protocol-specific query. | Phase 03; classify silence as inconclusive. |

## Read-only reference commands

Examples use an approved environment. Replace placeholders with authorized lab values. Commands are reference examples, not an instruction to run them against arbitrary hosts.

```bash
# Authorized target list and initial host inventory
nmap -sn -iL targets.txt -oA discovery

# Service identification on already identified ports
nmap -sV -p 22,80,443,445 <LAB_HOST> -oA services

# Confirm the reason for reported host/port states
nmap -sn --reason <LAB_HOST>
```

## Common mistakes and missed checks

- Overlooking nonstandard ports, UDP, virtual hosts and certificate names.
- Treating banners as definitive patch evidence.
- Discarding hosts solely because ICMP failed.

## When to stop and reassess

Stop a scan if errors, service instability or agreed rate limits indicate potential impact.

## Expected deliverable

An asset ledger with reachable endpoints, observed port states, service fingerprints and uncertainties.

## Related methodology

- [Complete penetration testing methodology]({{ '/posts/cpts-methodology/' | relative_url }})
- [Phase 03 — Service Enumeration and Infrastructure Assessment]({{ '/posts/cpts-phase-03-services/' | relative_url }})
- [Phase 04 — Web Discovery, Fuzzing and Request Analysis]({{ '/posts/cpts-phase-04-web-discovery/' | relative_url }})

## Study basis

Adapted from CPTS study topics: Network Enumeration with Nmap; Footprinting: Infrastructure; Information Gathering – Web Edition. The sequencing and validation criteria are an editorial synthesis for a public assessment reference.
