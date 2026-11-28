---
layout: page
title: "Thick Client Applications"
subtitle: "Architecture, analysis workflow, hardcoded credentials and web-layer attacks through a locally installed client"
permalink: /methodology/common-apps/thick-client-apps/
---

Thick client applications are installed on the endpoint and do much of their processing locally. They are written in Java, C++, .NET and similar languages, and they talk to a database or an application server. Their attack surface combines the weaknesses of local software, such as insecure storage and hardcoded secrets, with those of the web services they call. This page covers the architecture, the analysis workflow and two worked patterns: recovering hardcoded credentials and attacking the server through the client.

## Architecture

| Model | Path to the database | Test implication |
|-------|----------------------|------------------|
| Two-tier | The client connects directly to the database | Database credentials on the endpoint are the main target |
| Three-tier | The client calls an application server over HTTP or HTTPS | Test the server API as a web application |

Common weaknesses include improper error handling, hardcoded sensitive data, DLL hijacking, buffer overflows, SQL injection, insecure storage and weak session management.

## Workflow

1. Gather information: identify the language and framework, the install location, and the processes and files it creates. Tools include Detect It Easy, CFF Explorer, Process Monitor and Strings.
2. Analyse statically: decompile or disassemble the binary and search for credentials, keys and endpoints. Ghidra, IDA, dnSpy, JADX and Radare2 cover the main platforms.
3. Analyse dynamically: monitor file, registry and network activity while the application runs. Process Monitor, x64dbg and Frida are the usual tools.
4. Capture traffic: record the client's connections with Wireshark or tcpdump, or proxy them through Burp Suite.
5. Test the server side with the usual web attack methods, using the endpoints found in the client.

## Pattern 1: hardcoded credentials in a script or binary

A share that is readable by many users may contain an executable that runs a privileged task. Run it, and if it appears to do nothing, watch its behaviour:

```powershell
procmon64 /AcceptEula /Backingfile capture.pml
```

Process Monitor showed the program writing a temporary file under the user's profile. The file is deleted at once, so the folder's permissions were changed to block deletion, letting the file persist for inspection. Once the file is captured, the script that creates it can be read and analysed.

The captured script in the notes rebuilt an executable from base64 text. Recreating the binary from that text gives a program that can be analysed further:

```powershell
[System.IO.File]::WriteAllBytes("OUTPUT.exe", [System.Convert]::FromBase64String($salida))
```

Analysis of the rebuilt binary:

- Open it in x64dbg, starting at the exit point to skip loader code.
- Use the memory map to find a region that starts with the `MZ` header, which indicates an embedded executable, and dump it.
- A .NET binary can be cleaned with de4dot and then read in dnSpy.

In the notes, the decompiled source showed a credential hardcoded in a wrapper that restarts a service. The fix is to remove the secret from the code, not to change the file's position.

## Pattern 2: attacking the server through the client

The client and the server are two halves of one application, so the client reveals the server's surface.

1. Find configuration. A Spring `beans.xml` file held the server host, port and a shared secret.
2. Trace the connection. When the client fails to connect, capture its traffic to confirm the expected port, then correct the configuration.
3. Modify the signed JAR. The manifest signature must be removed before a changed JAR will run. Delete the signature files and the digest entries from `META-INF`, then rebuild the archive with `jar`.
4. Read the decompiled code. A client-side access check is not a control, because the server must enforce it again. Calls to privileged functions can be invoked directly.
5. Test the file features. A file browser that accepts a folder name may allow traversal. The notes show a filter that removed `/`, which the client code could be altered to bypass.
6. Test the login. The notes show a login that concatenated the username into an SQL query, and a client that hashed the password before sending it. Because the client builds the hash, an injected row can be constructed with a known password.

```text
abc' UNION SELECT 1,'abc','a@b.com','abc','admin
```

> Modifying and redistributing a client is a significant change to a production product. Keep the changes in a test copy, and do not distribute a modified binary outside the engagement.
{: .warning }

## What to look for

- Plaintext credentials, keys and connection strings in files, resources, configuration and memory.
- Client-side only checks on roles or features.
- SQL or path traversal behaviour in the server's responses, and error messages that reveal the query.
- Shared secrets in configuration that can be used to forge or replay requests.

## Pitfalls

- Obfuscated binaries can hide strings. Use dynamic analysis to capture decrypted values in memory.
- Changing folder permissions and code affects the target. Restore every change.

## Defense and prevention

Keep secrets out of the client. Enforce every authorisation decision on the server. Use parameterised queries, and validate paths against an allowed list rather than a filter. Sign binaries and protect their integrity, and use TLS with certificate validation for every connection. See the [application hardening](/methodology/common-apps/prevention/) page.
