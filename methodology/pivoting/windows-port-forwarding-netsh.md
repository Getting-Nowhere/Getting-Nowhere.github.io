---
layout: page
title: "Windows Port Forwarding with netsh"
subtitle: "Using the built-in portproxy feature of netsh to relay a port on a Windows pivot"
permalink: /methodology/pivoting/windows-port-forwarding-netsh/
---

`netsh` is the built-in Windows command-line tool for network configuration. Its `interface portproxy` context can relay a TCP port on one address of a Windows host to another address and port. When the pivot is a Windows machine, this needs no third-party binary. It is useful for reaching an internal RDP or web service from a network the attack host cannot route to directly.

## Workflow

1. Identify the pivot's address on the network the attack host can reach, and the internal target address and port.
2. Add a v4-to-v4 portproxy rule that listens on the pivot and connects to the target.
3. Verify the rule with `show`.
4. Confirm the pivot's firewall allows the listen port from the attack host.
5. Connect to the pivot's listen address and port from the attack host.
6. Delete the rule when finished.

```powershell
C:\Windows\system32> netsh.exe interface portproxy add v4tov4 listenport=8080 listenaddress=PIVOT_IP connectport=3389 connectaddress=TARGET_IP
```

```powershell
C:\Windows\system32> netsh.exe interface portproxy show v4tov4

Listen on ipv4:             Connect to ipv4:

Address         Port        Address         Port
--------------- ----------  --------------- ----------
PIVOT_IP        8080        TARGET_IP       3389
```

From the attack host, connect to the pivot's listen port:

```bash
attacker$ xfreerdp /v:PIVOT_IP:8080 /u:USERNAME /p:PASSWORD
```

## What to look for

- The `show` output must list the rule with the expected listen and connect pairs. An empty list means the rule was not added, usually because the command ran without administrator rights.
- The listen address must be a real address on the pivot. A rule on a loopback address is reachable only from the pivot itself.
- If the connection is refused from the attack host, check the Windows Firewall rules for the listen port.

## Pitfalls

- The rule relays TCP only. It does not forward UDP or ICMP.
- The portproxy service must be running on the pivot. Check its status if rules do not take effect.
- Rules persist across reboots unless removed, so record every rule and delete it after the engagement.

## Defense and prevention

Audit `netsh interface portproxy` rules on Windows servers as part of routine checks, because they are rarely expected on production hosts. Restrict the use of `netsh` to administrators, and alert on new portproxy entries.
