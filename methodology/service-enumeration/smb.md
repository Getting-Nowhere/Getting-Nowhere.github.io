---
layout: page
title: "SMB and Samba"
subtitle: "Share discovery, anonymous sessions and RID enumeration on ports 139 and 445"
permalink: /methodology/service-enumeration/smb/
---

## Purpose

Server Message Block (SMB) is a client-server protocol that exposes parts of a host's file system as shares, along with printers and inter-process pipes. Samba is the widely used open-source implementation for UNIX and Linux, and it can join an Active Directory domain or act as a domain controller. SMB is one of the most productive services to enumerate, because anonymous sessions frequently reveal share names, user accounts and configuration. This page covers those checks in order.

## Background

- SMB uses TCP 445 directly, and older implementations use TCP 139 through NetBIOS.
- Share and file access is governed by access control lists (ACLs) that set read, write and full access.
- CIFS is a dialect of SMB. Samba version 3 can be a full member of an Active Directory domain, and version 4 can act as a domain controller.
- A workgroup is a named collection of computers that share resources without a domain controller.

## Enumeration steps

### 1. Fingerprint the service

```bash
sudo nmap TARGET_IP -sV -sC -p139,445
```

Default scripts often add little for SMB. Their value is usually in confirming the host name, workgroup and SMB dialect so that later tools are pointed at the right target.

### 2. List shares anonymously

```bash
smbclient -N -L //TARGET_IP
```

`-L` lists the shares the server advertises, and `-N` requests a null (anonymous) session. The IPC$ share is normally present and is used for RPC.

### 3. Connect to a share

```bash
smbclient //TARGET_IP/SHARE
smbclient //TARGET_IP/SHARE -U USERNAME
```

Inside the client, `ls` lists the current directory and `get` downloads a file. Record which shares allow anonymous reads.

### 4. Query RPC anonymously

```bash
rpcclient -U "" TARGET_IP
```

| Query | Purpose |
| --- | --- |
| `srvinfo` | Server information |
| `enumdomains` | Domains deployed in the network |
| `querydominfo` | Domain, server and user counts |
| `netshareenumall` | All available shares |
| `netsharegetinfo SHARE` | Details for one share |
| `enumdomusers` | All domain users |
| `queryuser RID` | Details for one user, identified by relative ID |

### 5. Brute-force user RIDs

```bash
for i in $(seq 500 1100); do rpcclient -N -U "" TARGET_IP -c "queryuser 0x$(printf '%x\n' $i)" | grep "User Name\|user_rid\|group_rid" && echo ""; done
```

Each RID that resolves to an account returns its user name, RID and primary group RID. The range 500 to 1100 covers the built-in and early domain accounts. Widen the range if the scope requires it.

### 6. Use higher-level tools

```bash
smbmap -H TARGET_IP
nxc smb TARGET_IP -u '' -p ''
enum4linux-ng -A TARGET_IP
samrdump.py DOMAIN/USERNAME:PASSWORD@TARGET_IP
```

SMBMap reports share permissions. NetExec (`nxc`) checks authentication and signing status across hosts. enum4linux-ng gathers users, groups, shares and policy in one pass. Impacket's `samrdump.py` lists accounts through the SAM remote protocol and needs valid credentials in most configurations.

### 7. Review configuration (with host access)

```bash
cat /etc/samba/smb.conf | grep -v "#\|;"
```

## What to look for

| Setting | Risk |
| --- | --- |
| `browseable = yes` | Share names are visible to anyone who can list shares |
| `guest ok = yes` | Connection without a password |
| `read only = no` or `writable = yes` | Files can be created or modified |
| `create mask = 0777`, `directory mask = 0777` | New files are readable and writable by everyone |
| `map to guest = bad user` | Failed logins fall back to guest access |
| `logon script`, `magic script` | Scripts run on login or when a file is closed |

- Shares such as `print$`, `home`, `dev` or `notes` that hold configuration, scripts or credentials.
- Anonymous RID enumeration that returns real account names, which supports password spraying within lockout limits.
- Hosts where SMB signing is not required, which may allow relay attacks, and hosts still negotiating SMBv1.

> A share that is readable anonymously should be treated as published. Record the file names and sizes, and download only what the scope needs.
{: .info }

## Pitfalls

- **Samba versus Windows.** Samba configuration and Windows share ACLs behave differently. Confirm which one is in use before reading settings as authoritative.
- **Null sessions may be partial.** A null session can list shares but refuse RPC queries, so test each channel separately.
- **RID brute force is noisy.** Several hundred queries in a loop are obvious in logs. Use it only when the scope permits.
- **Lockout policies** apply to password guesses against user accounts discovered through RID enumeration.
- **SMBv1 status** varies. A message that SMB1 is disabled does not mean the host is unavailable on other dialects.

## Defense and prevention

Disable guest and anonymous access, restrict `browseable` and `guest ok` to what is needed, and apply least-privilege ACLs on every share. Require SMB signing, disable SMBv1, and avoid `create mask` and `directory mask` values that grant world write access. Restrict ports 139 and 445 to the hosts that need them, and keep scripts out of shares that users can write to.
