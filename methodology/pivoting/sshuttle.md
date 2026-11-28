---
layout: page
title: "sshuttle"
subtitle: "Routing a whole internal subnet through an SSH session without proxychains"
permalink: /methodology/pivoting/sshuttle/
---

sshuttle creates a transparent route for an entire subnet over an SSH connection to a pivot host. It sets up local firewall rules that send matching traffic through the SSH session, so ordinary tools reach internal hosts with no proxy configuration. It works only over SSH, so it does not carry HTTPS-based or Tor-based traffic. It is a good choice when many tools need to reach a network and the attack host has root.

## Workflow

1. Confirm SSH access to the pivot and identify the internal range from the pivot's routes.
2. Start sshuttle on the attack host with the pivot as the remote, and list the subnet to route.
3. Leave the session running. sshuttle adds the firewall rules on start and removes them on exit.
4. Run tools directly against internal addresses, with no `proxychains` prefix.
5. Stop sshuttle with Ctrl+C when finished, and confirm the routes are gone.

```bash
attacker$ sudo sshuttle -r USERNAME@PIVOT_IP INTERNAL_SUBNET -v
```

With the session active, a normal scan works without a proxy:

```bash
attacker$ nmap -sT -Pn -p 445,3389 TARGET_IP
```

## What to look for

- The verbose output shows the firewall rules being added. If it fails with a firewall error, the attack host's iptables setup may conflict with another tool.
- The `-r` option takes the user and host. Password prompts appear in the terminal, so keep the session attached.
- Test one known host first. If it is unreachable, check the subnet argument.

## Pitfalls

- The `-r` option needs the SSH username and host. Omitting the subnet means nothing gets routed.
- sshuttle does not carry UDP or non-SSH-compatible traffic in the way SOCKS tunnels do. Confirm the protocol before relying on it.
- Because it changes the attack host's routing rules, a crashed session can leave stale rules. Check them after an unexpected exit.

## Defense and prevention

Restrict which accounts can open TCP forwarding on the pivot, and limit the subnets an SSH user can reach through network controls. Alert on SSH sessions that suddenly carry traffic to many internal hosts.
