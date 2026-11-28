---
layout: page
title: "Vulnerable Services"
subtitle: "Identify third-party and local services that run as SYSTEM and expose an interface an unprivileged user can reach"
permalink: /methodology/privesc-windows/vulnerable-services/
---

Many escalation paths come from software installed on the host rather than from Windows itself. A third-party product may run a service as LocalSystem, expose a local interface, and accept requests without enough checking. This page covers how to build the list of candidate services, match it against known vulnerabilities, and decide whether a candidate is worth testing.

## Concept

A vulnerable service is one with a flaw that lets a low-privileged caller make the service act on its behalf. Common flaw classes include:

- Path traversal in a request parameter, letting the caller write or run files outside the intended folder.
- Command injection in a parameter passed to a shell or process launcher.
- Missing authentication on a local RPC or HTTP interface.
- Weak service permissions that let a user change how the service starts (see weak permissions).

Each class is found by checking the product version against vulnerability records, and then by confirming the behaviour in a lab copy.

## Workflow

### 1. Inventory installed software

```cmd
C:\htb> wmic product get name
```

```powershell
PS C:\htb> Get-WmiObject -Class Win32_Product | select Name, Version
PS C:\htb> Get-ItemProperty HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\* | Select-Object DisplayName, DisplayVersion
```

Note the product name and exact version. Backup, compliance, endpoint, VPN and remote access products are the most common candidates, because they tend to run privileged services.

### 2. Map the product to its services and processes

```powershell
PS C:\htb> get-service | ? {$_.DisplayName -like 'PRODUCT*'}
PS C:\htb> Get-Process -Id PROCESS_ID
```

Record the service name, the account it runs as (for example LocalSystem), the binary path and the start type.

### 3. Find local listeners

```cmd
C:\htb> netstat -ano | findstr PORT
```

A listener bound to 127.0.0.1 that belongs to a SYSTEM service is a candidate for local interaction. Confirm the owning PID matches the service's process.

### 4. Check the vulnerability record

Search vulnerability databases and vendor advisories for the product and version. Confirm:

- The affected versions include the installed version.
- The flaw is local, or reachable from the current account context.
- A patched version is documented, so the finding can be reported with a fix.

### 5. Check the service permissions

Before testing a candidate, confirm whether the service can also be reconfigured, as covered on the weak permissions page.

## Historical example

A backup and compliance client once ran a SYSTEM service that accepted RPC messages on a local port. Its request handling did not restrict the path used to launch an executable, so a crafted request could run a command as SYSTEM. The fix was a vendor update. The lesson is that the local port was the only entry point and that the product version was the decisive fact.

Windows itself has had service-level flaws of the same kind. Before a patch was released for one update service, the service's weak permissions allowed an unprivileged account to change its binary path and start it, which gave SYSTEM.

## What to look for

- A product version listed in a public advisory with a local privilege escalation impact.
- A SYSTEM service with a local listener and no authentication on its requests.
- Services with broad start or configuration rights.
- Old products that are no longer receiving updates.

> Confirm the installed version from the binary itself (file properties or the product's own tooling), not only from the registry. Uninstall entries can be stale.
{: .tip }

## Pitfalls

- Public proof-of-concept code often targets one build only. Verify the version before relying on it.
- Exploiting a local service can crash it. A crashed security product is an operational incident, so agree on the test window first.
- Vendors may have shipped a fix without changing the version string shown in the registry.
- Testing services that handle security or backup functions can affect other systems. Confirm scope.

## Defense

Maintain an inventory of installed software and versions, and patch third-party products on the same cadence as the operating system. Run local services with the least privilege they need, and require authentication on local interfaces. Remove software that is no longer used. Restrict service permissions to administrators, and monitor local listeners for new or unexpected ports.
