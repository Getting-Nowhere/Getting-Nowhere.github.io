---
layout: page
title: "Windows Remote Management"
subtitle: "RDP, WinRM and WMI enumeration and credentialed remote execution"
permalink: /methodology/service-enumeration/remote-management-windows/
---

## Purpose

Windows hosts are managed remotely through three main protocols: the Remote Desktop Protocol (RDP), Windows Remote Management (WinRM) and Windows Management Instrumentation (WMI). Each provides interactive or scripted control of the host, so each is valuable when the target has been reached and high-impact when exposed. This page covers how to identify each service, check its security settings and recognise what a valid login or group membership permits.

## 1. RDP (port 3389)

### Steps

**1.1 Identify and script the service**

```bash
sudo nmap -sV -sC -p 3389 --script "rdp*" TARGET_IP
```

The `-p 3389` flag is required so that the scan targets the RDP port. Add `--packet-trace` when the handshake needs to be inspected packet by packet.

**1.2 Check security settings without authenticating**

```bash
git clone https://github.com/CiscoCXSecurity/rdp-sec-check.git
cd rdp-sec-check
```

Run `rdp-sec-check.pl` against the target as its README describes. It reports the negotiated security layer (RDP native, TLS or CredSSP), whether Network Level Authentication is enforced, and the encryption level.

> Nmap's RDP handshake includes the cookie `mstshash=nmap`. Defenders and EDR products can match it, so the scan is visible to monitoring. Record that the scan is detectable.
{: .info }

## 2. WinRM (ports 5985 and 5986)

### Background

WinRM is the Windows implementation of WS-Management, which uses SOAP messages over HTTP. Port 5985 carries HTTP and port 5986 carries HTTPS. It is used for PowerShell remoting, and access normally requires membership in a local administrators or Remote Management Users group.

### Steps

**2.1 Identify the listener**

```bash
sudo nmap -sV -sC TARGET_IP -p 5985,5986
```

**2.2 Connect with Evil-WinRM**

Evil-WinRM is a PowerShell-oriented client for WinRM. Connect with the target, username and password within the scope, then confirm the account's group memberships with the standard `whoami /groups` command inside the session. A successful session indicates that the account is permitted to use WinRM, not that it has administrator rights.

## 3. WMI (RPC, port 135 and dynamic high ports)

### Background

WMI implements the Web-Based Enterprise Management (WBEM) standard. It exposes read and write access to most of a Windows system's settings, and remote WMI uses DCOM over RPC, starting at the endpoint mapper on TCP 135 and then negotiating high ports.

### Steps

**3.1 Execute a test command with Impacket**

```bash
wmiexec.py USERNAME:PASSWORD@TARGET_IP "hostname"
```

Impacket's `wmiexec.py` runs commands through WMI and returns the output over the same channel. The path to the script depends on how Impacket was installed. A successful return from a command such as `hostname` confirms the login and that WMI is reachable. Remote WMI execution usually requires administrative rights on the target.

## What to look for

| Service | Points of interest |
| --- | --- |
| RDP | Security layer negotiated, whether NLA is enforced, certificate host names, accounts permitted to log on |
| WinRM | Whether HTTP (5985) or HTTPS (5986) is offered, membership of Remote Management Users or Administrators |
| WMI | Whether a non-interactive command succeeds, which indicates administrative rights |

- RDP that accepts connections without NLA, which exposes the logon screen before authentication.
- WinRM on HTTP without encryption, where credentials and content are visible on the network path.
- Accounts that are members of Remote Management Users or local administrators on many hosts.
- Certificate names that reveal host and domain naming.

> Successful WMI or WinRM access with a standard user account is a privilege finding in its own right. Record the group that granted access and the commands that were permitted.
{: .tip }

## Pitfalls

- **Port numbers.** WinRM uses 5985 (HTTP) and 5986 (HTTPS). Do not use other values when filtering or documenting WinRM.
- **Scripts need the port flag.** Without `-p 3389`, the RDP scripts are not applied to the RDP port.
- **Detection.** RDP scans, WinRM sessions and WMI execution all generate logs and may trigger EDR alerts. Plan the sequence with the client.
- **Lockouts** from repeated password attempts can disable accounts that administrators depend on.
- **Blocked ports.** A firewall may allow 445 but block 135 or the dynamic RPC range, which stops WMI even when credentials are valid.

## Defense and prevention

Restrict 3389, 5985, 5986 and 135 to administrative subnets or a jump host. Require Network Level Authentication for RDP, use HTTPS for WinRM, and keep the Remote Management Users group small and reviewed. Enforce multi-factor authentication on remote administrative access where the platform supports it, deploy a local administrator password solution to limit reuse across hosts, and monitor WMI and PowerShell remoting for unexpected use.
