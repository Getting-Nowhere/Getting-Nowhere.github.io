---
layout: page
title: "SSH Local Port Forwarding"
subtitle: "Exposing a service on the SSH server's network through a local listener on the attack host"
permalink: /methodology/pivoting/ssh-local-forwarding/
---

SSH local port forwarding (`-L`) makes a service reachable from the SSH server's point of view available on a port of the attack host. It is the simplest form of port forwarding when a pivot host already accepts SSH and a single internal service needs to be reached, such as a database or web application listening only on the pivot's loopback interface.

## Workflow

1. Scan the pivot for ports that are open to the attack host and closed or filtered to the rest of the network. Use a TCP connect scan.
2. Choose a free local port on the attack host.
3. Start the forward so the local port maps to the service on the pivot's localhost.
4. Confirm the listener is bound on the attack host.
5. Connect to `127.0.0.1` on the chosen port with the client tool.
6. Add more `-L` options in the same command to forward several services.

```bash
attacker$ nmap -sT -p22,3306 TARGET_IP
attacker$ ssh -L 1234:localhost:3306 USERNAME@TARGET_IP
attacker$ netstat -antp | grep 1234
```

Forwarding several services in one session:

```bash
attacker$ ssh -L 1234:localhost:3306 -L 8080:localhost:80 USERNAME@TARGET_IP
```

Once the forward is up, point the client at the local port:

```bash
attacker$ mysql -h 127.0.0.1 -P 1234 -u USERNAME -p
```

## What to look for

- The `netstat` output should show the local port bound to `127.0.0.1` and `::1` in `LISTEN` state, owned by the `ssh` process.
- A service that is `closed` in an external Nmap scan on the pivot's address can still be reachable through the forward. This is the reason to forward it.
- If the connection is refused, check that the target port is listening on the pivot's localhost, not only on another interface.

## Pitfalls

> The `-L` destination is resolved from the SSH server's point of view. `localhost:3306` means the pivot's own loopback, not the attack host.
{: .warning }

- Local ports below 1024 need root on the attack host.
- A forward only reaches one destination per `-L` entry. It does not route a subnet. Use dynamic forwarding for that.
- Reusing a port already bound by another process causes a silent failure. Check with `netstat` first.

## Defense and prevention

Restrict which users can open TCP forwarding through `sshd_config` (`AllowTcpForwarding`) and bind internal services only to the interfaces they need. Alert on SSH sessions that create listeners on unexpected local ports.
