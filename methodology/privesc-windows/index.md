---
layout: page
title: "Windows Privilege Escalation"
subtitle: "A repeatable decision flow for moving from a low-privilege Windows user to SYSTEM or domain administrator."
permalink: /methodology/privesc-windows/
---

Windows privilege escalation is easiest when you work through it in a fixed order. Start with cheap, high-yield checks about your own context, then look for credentials you can reuse, then check the privileges and group memberships your account already holds. Only after those should you look at weaknesses in the operating system itself, because those are the noisiest and most likely to break something.

## Decision flow

```text
1. Situational awareness   -> who am I, what OS, what patches, what is running
2. Credential theft        -> files, registry, memory, browser and manager stores
3. Current privileges      -> SeImpersonate, SeDebug, SeTakeOwnership, ...
4. Group membership        -> DnsAdmins, Server Operators, Print Operators, ...
5. OS weaknesses           -> weak service/file permissions, UAC, DLL injection, kernel
6. Last resort             -> kernel exploits and end-of-life systems
```

## Pages in this section

### Lay of the land

- [Situational awareness](/methodology/privesc-windows/situational-awareness/)
- [Interacting with other users and processes](/methodology/privesc-windows/interacting-with-users/)
- [Process communication](/methodology/privesc-windows/process-communication/)
- [Miscellaneous techniques](/methodology/privesc-windows/miscellaneous-techniques/)

### Credential theft

- [Credential hunting](/methodology/privesc-windows/credential-hunting-windows/)
- [More credential theft](/methodology/privesc-windows/more-credential-theft/)
- [Pillaging](/methodology/privesc-windows/pillaging/)

### Privileges held by the current user

- [Windows privileges overview](/methodology/privesc-windows/windows-privileges-overview/)
- [SeDebugPrivilege](/methodology/privesc-windows/sedebug-privilege/)
- [SeImpersonate and potato-style abuse](/methodology/privesc-windows/seimpersonate-potato/)
- [SeTakeOwnershipPrivilege](/methodology/privesc-windows/setakeownership-privilege/)

### Group membership

- [Built-in groups](/methodology/privesc-windows/builtin-groups/)
- [DnsAdmins](/methodology/privesc-windows/dnsadmins/)
- [Print Operators](/methodology/privesc-windows/print-operators/)
- [Server Operators](/methodology/privesc-windows/server-operators/)
- [Event Log Readers](/methodology/privesc-windows/event-log-readers/)
- [Hyper-V Administrators](/methodology/privesc-windows/hyper-v-administrators/)

### OS weaknesses

- [Weak permissions](/methodology/privesc-windows/weak-permissions/)
- [Vulnerable services](/methodology/privesc-windows/vulnerable-services/)
- [UAC bypass](/methodology/privesc-windows/uac-bypass/)
- [DLL injection](/methodology/privesc-windows/dll-injection/)
- [Kernel exploits](/methodology/privesc-windows/kernel-exploits/)
- [End-of-life systems](/methodology/privesc-windows/end-of-life-systems/)
- [Citrix breakout](/methodology/privesc-windows/citrix-breakout/)

### Defense

- [Prevention](/methodology/privesc-windows/prevention/)

## Checklist

- ☐ Identity, group memberships and privileges (`whoami /all`) recorded
- ☐ OS version, patch level and architecture recorded
- ☐ Credential stores and config files searched
- ☐ Current privileges reviewed for abuse paths
- ☐ Non-default group memberships reviewed
- ☐ Service, file and registry permissions checked
- ☐ UAC state and auto-elevation paths checked
- ☐ Kernel and end-of-life exposure checked only after the above
- ☐ Each finding recorded with its defensive fix
