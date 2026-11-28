---
layout: page
title: "SOCKS over RDP"
subtitle: "Tunnelling SOCKS traffic through the dynamic virtual channels of an existing RDP session"
permalink: /methodology/pivoting/socks-over-rdp/
---

SocksOverRDP uses the dynamic virtual channel (DVC) feature of the Windows RDP service. DVCs carry features such as clipboard transfer and audio, and the same channel can carry arbitrary packets. A plugin on the pivot exposes a SOCKS proxy that rides on the RDP connection. Use this when the only reliable path into a Windows network is RDP and no SSH or other tunnel is available.

## Workflow

1. Download the x64 SocksOverRDP binaries and a portable Proxifier build for the Windows pivot.
2. Connect to the pivot over RDP and copy the SocksOverRDP files to it.
3. Register the SocksOverRDP plugin DLL with `regsvr32.exe`.
4. Confirm a SOCKS listener is open on `127.0.0.1:1080` on the pivot.
5. Copy Proxifier to the pivot and configure it to send traffic to the local SOCKS port.
6. Open an RDP client through Proxifier to reach the internal host.

```powershell
C:\> regsvr32.exe SocksOverRDP-Plugin.dll
C:\> netstat -antb | findstr 1080
  TCP    127.0.0.1:1080         0.0.0.0:0              LISTENING
```

Proxifier then sends the RDP client's traffic through `127.0.0.1:1080`, which carries it over the RDP session to the pivot, and the pivot forwards it onward to the internal host.

## What to look for

- The `netstat` output must show `127.0.0.1:1080` in `LISTENING` state. If it is missing, the plugin did not register. Check the `regsvr32` output for errors.
- The plugin is loaded per session. Confirm the listener is present after each reconnection.
- If Proxifier is configured but the RDP client still connects directly, the proxy rule is not matching the application.

## Pitfalls

- The RDP session itself must stay connected, because it carries the SOCKS traffic. A dropped session breaks the tunnel.
- Registering a DLL with `regsvr32` changes the system and should be removed when the work is complete.
- The tunnel is slow compared with SSH. Use it for interactive RDP sessions and small transfers.

## Defense and prevention

Restrict which accounts can use RDP and from which hosts, enable network-level authentication, and monitor for unexpected DLL registrations and processes listening on loopback ports.
