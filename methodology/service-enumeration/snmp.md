---
layout: page
title: "SNMP"
subtitle: "Community string discovery, MIB walks and device information disclosure on UDP 161"
permalink: /methodology/service-enumeration/snmp/
---

## Purpose

The Simple Network Management Protocol (SNMP) lets administrators monitor and manage network devices such as routers, switches, printers and servers. Its data model is detailed enough to reveal interfaces, routing tables, running processes, installed software and user accounts. Many deployments still use community strings sent in plain text, which makes SNMP one of the most informative services to enumerate. This page covers discovery, community string testing, targeted walks and configuration review.

## Background

- SNMP runs over UDP port 161. Traps, which are unsolicited notifications from devices to a manager, are conventionally sent to UDP 162.
- A **Management Information Base (MIB)** is a text file that describes the queryable objects on a device. MIB files are written in ASN.1.
- Each queryable object has an **Object Identifier (OID)**, a dotted sequence of integers that defines a node in a tree. An OID also describes the object's type, access rights and purpose.
- **SNMPv1 and v2c** use community strings, which act as shared passwords and are sent without encryption. SNMPv1 has no built-in authentication beyond the community string.
- **SNMPv3** adds user-based authentication and optional encryption.

## Enumeration steps

### 1. Confirm the service

```bash
sudo nmap -sU -p 161 -sV TARGET_IP
```

Scan UDP explicitly with `-sU`. Because UDP responses are unreliable, a closed result should be retested before it is recorded as final.

### 2. Discover community strings

```bash
onesixtyone -c WORDLIST TARGET_IP
```

Build a custom list where the target's naming is likely to appear, such as organisation or device names. The `crunch` tool can generate a candidate list:

```bash
crunch MIN MAX CHARSET -o community.txt
onesixtyone -c community.txt TARGET_IP
```

Common defaults such as `public` and `private` should be tested first, since they are frequently left in place.

### 3. Walk the MIB tree

```bash
snmpwalk -v2c -c COMMUNITY TARGET_IP
```

A full walk returns every object the community can read. Begin with the system subtree (`1.3.6.1.2.1.1`), which contains `sysDescr`, `sysContact`, `sysLocation` and `sysName`.

### 4. Query specific OIDs with braa

```bash
braa COMMUNITY@TARGET_IP:.1.3.6.1.2.1.1.*
```

`braa` queries individual OIDs quickly and is useful when a full walk is too large. Useful branches include:

| OID branch | Information |
| --- | --- |
| `1.3.6.1.2.1.1` | System description, contact, location and name |
| `1.3.6.1.2.1.2` | Network interfaces |
| `1.3.6.1.2.1.4` | IP addresses and routing |
| `1.3.6.1.2.1.6.13` | TCP connection and listening-port table |
| `1.3.6.1.2.1.25.4.2.1.2` | Running process names (HOST-RESOURCES-MIB) |
| `1.3.6.1.4.1.77.1.2.25` | Local user accounts on Windows hosts |

### 5. Review configuration (with host access)

```bash
cat /etc/snmp/snmpd.conf | grep -v "#" | sed -r '/^\s*$/d'
```

Look at the `rocommunity`, `rwcommunity`, `rouser` and `view` directives, and at the contact and location details that the device discloses.

## What to look for

| Directive | Risk |
| --- | --- |
| `rocommunity public default` | Read access to the permitted view for any source address |
| `rwcommunity COMMUNITY ADDRESS` | Write access to the full OID tree from the given address |
| `rwuser noauth` | Write access to the full OID tree without authentication |
| `rocommunity6` / `rwcommunity6` | The same exposure over IPv6 |
| `view systemonly included ...` | Limits the views a community can read |

- Default or guessable community strings such as `public`, `private` or the organisation name.
- Process and installed-software listings that reveal unpatched or unexpected services.
- Contact details and locations that help map ownership of the device.
- Any write access, which can change device configuration.

> SNMP write access (`rw` community or `rwuser noauth`) can change device settings, not just read them. Confirm scope before any write-capable test, and do not write during enumeration.
{: .danger }

## Pitfalls

- **Plain-text transport.** Community strings are visible to anyone on the network path, which means a sniffed string can be replayed.
- **Large walks** are slow and produce heavy output. Use `braa` or targeted OIDs when only a branch is needed.
- **Read-only does not mean harmless.** Process lists and routing tables are sensitive even without write access.
- **Empty responses** can mean the community is wrong, the view is restricted or the device has no data for that branch. Test the system subtree first.
- **Version mismatches.** Using v2c against a v3-only device returns nothing. Confirm the version with the scan before concluding that the service is locked.

## Defense and prevention

Use SNMPv3 with authentication and privacy (`authPriv`) wherever the device supports it, and disable v1 and v2c. Remove default community strings, use long, unique values where v2c must remain, and restrict access by source address. Keep views read-only, avoid `rwuser noauth` and `rwcommunity`, and limit the SNMP port to management hosts.
