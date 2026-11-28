---
layout: page
title: "Network Scanning"
subtitle: "Phase checklist and index for host discovery, port scanning, and service enumeration with Nmap"
permalink: /methodology/network-scanning/
---

Network scanning turns a list of addresses into a map of live hosts, open ports, running services, and the controls that filter them. Nmap is the primary tool for this work. It is used by network administrators and security practitioners to audit network security, check firewall and IDS behaviour, map networks, identify open ports, and assess vulnerabilities. Enumeration is the core of the method: each step should explain what the target exposes (what you see) and what it hides (what you do not see), and how filtering affects that picture. Scan only the agreed scope, start with the least intrusive technique that answers the question, and record the exact command and output for every scan.

## Phase checklist

- ☐ Confirm scope, permitted scan types, and timing limits
- ☐ Discover live hosts with ICMP and ARP techniques, then with alternative probes if needed
- ☐ Run a quick port scan (top ports) on each live host
- ☐ Run a full TCP port scan with a SYN scan (root) or a connect scan (non-root)
- ☐ Scan UDP separately on the most relevant ports
- ☐ Trace packets on unexpected results to classify port states
- ☐ Identify filtered ports and test firewall rules with ACK scans
- ☐ Detect service versions and grab banners on every open port
- ☐ Run relevant NSE script categories, and read the category before running any script
- ☐ Tune timing to balance completeness against noise and speed
- ☐ Test evasion options only when filtering blocks the scan and the rules allow it
- ☐ Save output in all formats (`-oA`) and record the command line used

## Pages in this section

- [Host discovery](/methodology/network-scanning/host-discovery/)
- [Port scanning workflow](/methodology/network-scanning/port-scanning-workflow/)
- [Packet tracing and port states](/methodology/network-scanning/packet-tracing-and-port-states/)
- [Service version detection and banner grabbing](/methodology/network-scanning/service-version-and-banners/)
- [NSE scripts and aggressive scans](/methodology/network-scanning/nse-scripts-and-aggressive-scan/)
- [Performance tuning](/methodology/network-scanning/performance-tuning/)
- [Firewall rule testing](/methodology/network-scanning/firewall-rule-testing/)
- [Firewall and IDS evasion](/methodology/network-scanning/firewall-and-ids-evasion/)

Web-level reconnaissance is covered in the [recon section](/methodology/recon/).
