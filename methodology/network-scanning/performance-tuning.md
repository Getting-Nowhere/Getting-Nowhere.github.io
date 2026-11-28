---
layout: page
title: "Performance Tuning"
subtitle: "Balancing scan speed against completeness with timing, RTT, rate, and retry options"
permalink: /methodology/network-scanning/performance-tuning/
---

## Purpose

Nmap waits for replies, retries lost probes, and adjusts its pace based on network conditions. Tuning these settings decides how long a scan takes and how many hosts and ports it finds. Faster is not automatically better: aggressive timing can make a scan miss open ports, and it can flood a network or trip an IDS. Set the timing to fit the network, then verify the results against a baseline.

## Key concepts

- **Round-trip time (RTT):** the time between a probe and its reply. Nmap estimates RTT per host and uses it to decide how long to wait. High-latency networks such as VPNs and wireless links need longer waits.
- **Retries:** the number of times Nmap resends a probe that receives no reply. The default is 10.
- **Parallelism:** the number of probes in flight at once.
- **Rate:** the minimum number of packets sent per second.

## Options

| Option | Effect |
|---|---|
| `-T0` to `-T5` | Timing template; `-T0` is the slowest and stealthiest, `-T5` the fastest |
| `--initial-rtt-timeout <time>` | Starting wait for a reply |
| `--max-rtt-timeout <time>` | Upper limit on the wait for a reply |
| `--min-parallelism <number>` | Minimum number of probes in parallel |
| `--min-rate <number>` | Minimum packets per second |
| `--max-retries <number>` | Maximum resends for each probe |

## Workflow

1. Establish a baseline with default timing on a range. Record the number of hosts up and the open ports found.

```bash
sudo nmap TARGET_NET/24 -F
```

2. Tighten the RTT settings to speed the scan, then compare the result with the baseline.

```bash
sudo nmap TARGET_NET/24 -F --initial-rtt-timeout 50ms --max-rtt-timeout 100ms
```

3. If the count of live hosts or open ports drops, the timing is too aggressive. Loosen the setting until the results match the baseline.

4. Reduce retries only when speed matters more than completeness. Compare the results to find the cost.

```bash
sudo nmap TARGET_NET/24 -F --max-retries 0
```

5. Set a minimum rate on a network that can handle it, for example a fast wired segment. Lower it for wireless or constrained links.

```bash
sudo nmap TARGET_IP -p- --min-rate 300
```

## What the results showed

In a comparison of default and tightened RTT settings on the same range, the tightened run found fewer live hosts and fewer open ports in less time. The shorter wait gave slow hosts too little time to reply, so Nmap marked them as down or missed their ports. Reducing retries to zero produced the same kind of loss.

> Speed numbers only matter when the result is complete. Always compare a fast setting against a known-good baseline before trusting its output.
{: .warning }

## Decision points

- **Stable local network:** a faster template and a higher minimum rate are usually safe. Confirm the baseline.
- **Remote or high-latency target:** keep default RTT values, and increase them if replies arrive late.
- **Lossy or wireless link:** keep retries at the default and set a moderate rate.
- **Monitored environment:** lower the rate and timing to reduce alerts, and accept a longer scan.

## Pitfalls

- A very high rate can overwhelm small devices and cause the target to stop responding during the scan.
- Results from a fast scan may look normal while missing ports. Compare counts with a slower run.
- Timing templates set many values at once. Check which individual options a template changes before combining it with manual values.

## Defense and prevention

- Rate-limit connection attempts and new connection bursts at the perimeter.
- Set IDS thresholds for scanning activity so that fast sweeps are detected.
- Keep devices sized to handle legitimate burst traffic without degrading service.
