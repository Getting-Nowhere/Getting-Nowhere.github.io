---
layout: page
title: "Double Pivots"
subtitle: "Chaining two hops when the internal network you need is two segments away from the attack host"
permalink: /methodology/pivoting/double-pivots/
---

A double pivot passes traffic through two compromised hosts. The first pivot reaches a segment the attack host cannot route to. The second pivot sits on a segment only the first pivot can see, and the target lives behind it. Each hop adds latency and another point of failure, so chain only when no single pivot reaches the target. The notes show this with a Windows pivot that carries SOCKS traffic over RDP to a second internal network.

## Workflow

1. Map the networks each host can reach, starting from the first pivot's routes and interfaces.
2. Identify a second host that is reachable from the first pivot and sits on the segment with the target.
3. Choose a tunnel for the first hop that works on the first pivot's platform, such as SSH dynamic forwarding or SocksOverRDP.
4. Establish the first hop and confirm the local SOCKS port is listening.
5. Route the second hop's tools through the first tunnel, using proxychains or a desktop proxy.
6. Test one connection to the target before wider scanning.

In the example in the notes, the chain is:

```text
attacker -> RDP and SOCKS over RDP -> Windows pivot (INTERNAL_SUBNET side)
         -> internal RDP -> TARGET_IP on the next segment
```

```powershell
C:\> netstat -antb | findstr 1080
  TCP    127.0.0.1:1080         0.0.0.0:0              LISTENING
```

From the attack host, the tunnel carries the RDP client through both hops. Proxifier on the pivot routes traffic for the internal host through the local SOCKS port.

## What to look for

- Confirm each hop separately. A chain fails at whichever hop is not listening.
- Record which address belongs to which segment, so that a scan or connection is not aimed at the wrong hop.
- Latency rises with each hop. Expect slow sessions and set longer timeouts.

## Pitfalls

- Losing the first hop breaks the whole chain. Keep the first session open and monitored.
- Tunnel the minimum needed. Routing a whole subnet through two hops multiplies the traffic that can be noticed.
- Document each hop's listener and rule, and remove them in reverse order at the end.

## Defense and prevention

Segment networks so that a workstation or server cannot reach a second network it has no business with. Dual-homed hosts are the usual chain point. Review their interfaces and routes, and alert on unusual traffic between segments.
