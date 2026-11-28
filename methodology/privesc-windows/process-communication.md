---
layout: page
title: "Process Communication"
subtitle: "Find local listeners and named pipes that a low-privilege user can reach and that a privileged process trusts"
permalink: /methodology/privesc-windows/process-communication/
---

Processes talk to each other over loopback sockets, named pipes and other IPC channels. A privileged service that exposes an interface to local users, and that does not check who is calling, can be driven into doing work on the caller's behalf. This page covers how to find those interfaces and check who can reach them.

## Why it matters

Services are often hardened against the network but not against local callers. A socket bound to 127.0.0.1 is assumed to be private, and a pipe with a permissive DACL is assumed to be used only by its owner. Both assumptions fail when the service runs as SYSTEM and does not authenticate its clients.

## Workflow

### 1. Listening sockets

```cmd
C:\htb> netstat -ano
C:\htb> netstat -ano | findstr 127.0.0.1
```

Look for loopback listeners (127.0.0.1 or ::1) that are not on the wildcard address. Map each PID to a process and service:

```powershell
PS C:\htb> Get-Process -Id (Get-NetTCPConnection -LocalPort PORT).OwningProcess
PS C:\htb> Get-Service | ? {$_.DisplayName -like 'NAME*'}
```

Well-known examples include administrative interfaces of file transfer clients, log forwarders that run as SYSTEM by default, and clustering ports that trust a shared secret. Each needs its own check of how it authenticates.

### 2. Named pipes

```cmd
C:\htb> pipelist.exe /accepteula
```

```powershell
PS C:\htb> gci \\.\pipe\
```

A named pipe server is the process that creates the pipe. Clients connect to it, either one-way or two-way. Each connection creates a new pipe instance that shares the name.

### 3. Pipe permissions

```cmd
C:\htb> accesschk.exe /accepteula \\.\Pipe\lsass -v
C:\htb> accesschk.exe -w \pipe\* -v
```

The DACL shows which principals can read, write or control each pipe. Flag pipes where a broad group (Everyone, Authenticated Users, Users) has write or full access and the owning process runs as SYSTEM or another privileged account. Pipes owned by SYSTEM that are writable by low-privileged users are a particularly strong lead.

## What to look for

- Loopback listeners owned by services running as SYSTEM or as a privileged service account.
- Pipes with a broad write or full-control ACE.
- Services with their own administrative interface on localhost that accepts commands without strong authentication.
- Erlang or similar clustering ports that rely on a shared cookie stored on disk.

> A pipe or socket is only interesting when you can reach it from the current context and the service behind it acts on the caller's input. Confirm both before investing time.
{: .tip }

## Pitfalls

- Some services check the client's identity but only for a subset of commands. Test each interface carefully.
- Exploiting an IPC interface can crash the service. A crashed security service is a visible incident, so agree on the test window first.
- Pipe names used by C2 frameworks are often designed to look like legitimate names. Do not confuse your own pipes with the target's.
- Pipe listings change as services start and stop. Re-check after a reboot or service restart.

## Defense

Bind administrative interfaces to nothing or to a specific authenticated channel, and do not rely on localhost as a security boundary. Restrict named pipe DACLs to the owning service and administrators. Audit pipe and socket exposure as part of the service inventory, and remove default credentials or shared cookies from IPC-based products. Keep third-party services that run as SYSTEM to a minimum.
