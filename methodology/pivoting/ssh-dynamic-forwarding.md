---
layout: page
title: "SSH Dynamic Port Forwarding"
subtitle: "Creating a SOCKS proxy through an SSH pivot host with ssh -D and proxychains"
permalink: /methodology/pivoting/ssh-dynamic-forwarding/
---

SSH dynamic port forwarding (`-D`) opens a SOCKS proxy on the attack host and sends every connection made through it across the SSH session, out of the pivot host into its other networks. It is the usual way to route multiple tools into a segment without a separate forward per port. Pair it with `proxychains` so that tools that do not support proxies still traverse the tunnel.

## Workflow

1. Confirm the pivot host has a second NIC or a route to the internal range (`ifconfig`, `netstat -r` on the pivot).
2. Start the SOCKS listener by opening an SSH session with `-D`.
3. Point `proxychains` at the local SOCKS port in `/etc/proxychains.conf`.
4. Run tools through `proxychains`. Use TCP connect scans for hosts behind the pivot.
5. Keep the SSH session open for the lifetime of the work.

```bash
attacker$ ssh -D 9050 USERNAME@PIVOT_IP
attacker$ tail -4 /etc/proxychains.conf
# socks4  127.0.0.1 9050
```

```bash
attacker$ proxychains nmap -v -sn INTERNAL_SUBNET
attacker$ proxychains nmap -v -Pn -sT TARGET_IP
attacker$ proxychains msfconsole
attacker$ proxychains xfreerdp /v:TARGET_IP /u:USERNAME /p:PASSWORD
```

## What to look for

- A successful `proxychains` run prints the chain and the proxy address. If it fails immediately, the SOCKS listener is not running.
- Host discovery with ICMP (`-sn`) usually returns nothing for Windows targets, because Windows blocks ICMP echo by default. Use `-Pn -sT` instead.
- Compare SOCKS4 and SOCKS5 entries. SOCKS4 has no authentication. SOCKS5 supports it and is needed for some tunnels such as Chisel.

## Pitfalls

> proxychains cannot handle partial or raw traffic. Use TCP connect scans (`-sT`) and do not expect SYN or UDP scans to work.
{: .warning }

- Nmap host discovery through SOCKS is unreliable, so an empty result does not prove a host is down.
- Use the proxy only for tools that open TCP connections. Tools that send UDP or raw packets will bypass it or fail.
- Sessions that drop take the SOCKS listener with them. Re-run `ssh -D` and check the port before resuming scans.

## Defense and prevention

Disable TCP forwarding for accounts that do not require it (`AllowTcpForwarding no` in `sshd_config`), and restrict outbound connections from servers to known destinations. Monitor for SSH sessions that open many concurrent connections to internal hosts.
