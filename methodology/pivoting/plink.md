---
layout: page
title: "Plink"
subtitle: "Starting SSH dynamic forwards and SOCKS proxies from a Windows host with plink.exe"
permalink: /methodology/pivoting/plink/
---

Plink is the command-line version of PuTTY's SSH client. It runs on Windows and offers the same dynamic forwarding as OpenSSH. A Windows host with `plink.exe` can therefore open a SOCKS proxy through an SSH server, which suits Windows environments where OpenSSH is not installed. Pair it with a desktop proxy client such as Proxifier when GUI applications need to use the tunnel.

## Workflow

1. Transfer `plink.exe` to the Windows host, and confirm the SSH server it will connect to is reachable from there.
2. Start plink with the dynamic forward option on a local port.
3. Leave the session running. The SOCKS listener closes when the session ends.
4. Point the tool or the desktop proxy at the local SOCKS port.
5. Test with one connection before opening a wider set of forwards.

```powershell
C:\> plink -ssh -D 9050 USERNAME@PIVOT_IP
```

The `-ssh` flag selects the SSH protocol. The `-D` flag opens the dynamic SOCKS listener on the local port, 9050 in this example.

For GUI applications, configure Proxifier with a SOCKS entry on `127.0.0.1:9050`. Then start the desktop client, such as the remote desktop client, through the proxy profile.

## What to look for

- Plink prompts for the password or the host key the first time it connects. Accept the host key only after checking it.
- The local SOCKS port must be listening after the session starts. Check with `netstat -ano` on the Windows host.
- If applications fail through the proxy, confirm they open TCP connections. UDP and ICMP do not traverse the SOCKS tunnel.

## Pitfalls

- Plink and the proxy client must use the same local port. A mismatch fails silently.
- Passwords typed on the command line can be visible to other users and in process listings. Prefer key-based login where possible.
- A closed Plink session takes the SOCKS listener with it.

## Defense and prevention

Block or monitor unapproved binaries such as `plink.exe` on servers and workstations, and watch for outbound SSH from Windows hosts, which is uncommon in most environments. Enforce allow-listing of applications on servers.
