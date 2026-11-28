---
layout: page
title: "ICMP Tunnelling"
subtitle: "Carrying SSH inside ICMP echo packets with ptunnel-ng when only ping traffic is allowed out"
permalink: /methodology/pivoting/icmp-tunnelling/
---

ICMP tunnelling wraps TCP traffic inside ICMP echo request packets. It works only when the firewall allows ping traffic to reach the pivot. The tool used here, ptunnel-ng, runs a proxy on the pivot that converts the ICMP stream back to TCP, and a client on the attack host that exposes a local TCP port. An SSH session through that port can then be used as the base for SOCKS forwarding.

## Workflow

1. Confirm the pivot answers ping from the attack host and that other protocols are blocked.
2. Build ptunnel-ng on the attack host and copy the source directory to the pivot with `scp -r`, which handles the directory tree.
3. Start the server on the pivot. It listens for ICMP and forwards the traffic to the local SSH service on port 22.
4. Start the client on the attack host. It listens on a local TCP port and sends traffic as ICMP to the pivot.
5. Connect SSH to the local port. The SSH session travels inside ICMP.
6. Open a dynamic forward over that SSH session for proxychains use.

```bash
attacker$ sudo ./autogen.sh
attacker$ scp -r ptunnel-ng USERNAME@PIVOT_IP:~/
```

```bash
pivot$ sudo ./ptunnel-ng -r PIVOT_IP -R22
```

```bash
attacker$ sudo ./ptunnel-ng -p PIVOT_IP -l 2222 -r PIVOT_IP -R22
attacker$ ssh -p 2222 USERNAME@127.0.0.1
attacker$ ssh -D 9050 -p 2222 USERNAME@127.0.0.1
```

Wireshark or another capture tool on the attack host shows the ICMP packets carrying the session.

## What to look for

- The server reports that it is forwarding incoming ping packets over TCP and has dropped privileges. If it fails to start, check the root requirement and the library warnings.
- The client reports that it is relaying TCP streams. Any SSH connection to the local port should succeed quickly.
- Latency is high and throughput is low. Keep tool use small and avoid large file transfers.

## Pitfalls

- If the firewall blocks ICMP echo, the tunnel never comes up. Test with a ping first.
- The notes run ptunnel-ng with `sudo` on both ends. Expect to need root for it to open its ICMP listener.
- The `-R` value points at the SSH port on the pivot. Change it if SSH listens elsewhere.

## Defense and prevention

Block ICMP echo at the perimeter where it is not required, or rate-limit it. Monitor for ICMP traffic with large payloads or a steady high rate, which is unusual for normal ping use.
