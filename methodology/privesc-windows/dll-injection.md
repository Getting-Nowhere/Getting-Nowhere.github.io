---
layout: page
title: "DLL Injection and Hijacking"
subtitle: "Understand how code is loaded into processes, how DLL search order is abused, and how to check exposure"
permalink: /methodology/privesc-windows/dll-injection/
---

DLL injection places code inside a running process so that the code runs in that process's context. DLL hijacking is a narrower case: a privileged process loads a DLL from a location the attacker controls. For escalation, hijacking is the relevant form, because it needs no access to the target process. Injection is covered here so that the techniques can be recognised in detection and in incident reports.

## Injection classes

| Class | Mechanism | Detection focus |
|---|---|---|
| LoadLibrary injection | Remote thread calls LoadLibrary with a DLL path written into the target | Remote thread creation, cross-process memory writes |
| Manual mapping | The loader maps the DLL sections and resolves imports itself, avoiding LoadLibrary | Unbacked executable memory, unusual section mappings |
| Reflective injection | The DLL contains its own loader and runs from memory | Executable memory without a file on disk |

Legitimate uses include hot patching and debugging. Anti-cheat and endpoint products monitor for these patterns, because they are common in malware.

## DLL hijacking

A process that loads a DLL by name without an absolute path searches a list of folders. If a folder earlier in that list is writable by the attacker, a planted DLL with the expected name is loaded first.

### Search order

With Safe DLL Search Mode enabled (the default), the search runs:

1. The directory the application was loaded from
2. The system directory (System32)
3. The 16-bit system directory
4. The Windows directory
5. The current directory
6. The directories listed in PATH

With Safe DLL Search Mode disabled, the current directory is searched second, before the system directories.

## Workflow

### 1. Check Safe DLL Search Mode

```cmd
C:\htb> reg query "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager" /v SafeDllSearchMode
```

A value of 1 (or the absence of the value, which defaults to enabled) keeps the current directory later in the order. A value of 0 disables it.

### 2. Identify missing DLLs

Process Monitor (Sysinternals) finds DLL lookups that fail. Filter for:

- Path ends with .dll
- Result is NAME NOT FOUND

Each hit shows a process that looked for a DLL and did not find it, and the folder it searched. Repeat the capture while starting and using the application, since loads happen at different times.

### 3. Check the search folder ACL

```cmd
C:\htb> icacls "C:\PATH\TO\SEARCHED_FOLDER"
```

A folder that the current user can write to, and that a privileged process searches, is the hijack location. Check each folder in the search order, including PATH entries.

### 4. Confirm which DLLs are loaded

Process Explorer shows the DLLs loaded by a running process. Use it to confirm that a DLL is loaded from an expected location and to find DLLs loaded from user folders.

## Proxying

A proxy DLL exports the same functions as the original and forwards calls to a renamed copy of the original. This keeps the application working while adding behaviour. In an assessment, proxying is used to show that a hijack is viable without breaking the application. It is a demonstration technique, not a finding in itself.

## What to look for

- A privileged service or scheduled task that loads a DLL that does not exist.
- A writable folder ahead of the real DLL location in the search order.
- Auto-elevating processes that load DLLs from user-writable folders.
- DLLs loaded from user profile folders by services.

## Pitfalls

- Loading a planted DLL that is malformed or has the wrong export set can crash the process. Test on a copy where possible.
- Some processes load DLLs only on specific actions or during startup. Missing an event is common.
- Known Windows DLLs are protected by the KnownDLLs list and cannot be hijacked by name.
- Antivirus and application control rules often block unsigned DLLs in user folders.

## Defense

Enable Safe DLL Search Mode and keep it enabled. Use absolute paths when loading libraries. Restrict write access to program folders, service folders and every PATH entry to administrators. Enforce application control rules for DLLs, not only executables. Monitor for DLL loads from user-writable locations by privileged processes, and review NAME NOT FOUND results during application testing so that missing dependencies are fixed by the vendor.
