---
layout: page
title: "NFS"
subtitle: "Export discovery, mounting and UID-based access control on ports 111 and 2049"
permalink: /methodology/service-enumeration/nfs/
---

## Purpose

The Network File System (NFS) shares directories between UNIX and Linux systems. It is common in data centres and on lab networks, and its security model is weak by default: the server does not authenticate users itself and instead trusts the identity the client reports. This page covers how to find exported shares, mount them, inspect ownership and recognise the export options that create exposure.

## Background

| Version | Notes |
| --- | --- |
| NFSv2 | Older, widely supported, originally operated entirely over UDP |
| NFSv3 | Variable file sizes and better error reporting, not fully compatible with NFSv2 clients |
| NFSv4 | Stateful, supports Kerberos and ACLs, works through firewalls, and does not require the portmapper |

NFS is built on ONC-RPC. Authentication is delegated to RPC, while authorisation comes from the file system itself, usually as UNIX UIDs, GIDs and group memberships. Because the server accepts the identifiers the client presents, access control is only as strong as the client's identity assertions.

The ports to test are 111 (portmapper and rpcbind) and 2049 (NFS). NFSv4 needs only 2049.

## Enumeration steps

### 1. Scan the RPC and NFS ports

```bash
sudo nmap TARGET_IP -p111,2049 -sV -sC
sudo nmap --script "nfs*" TARGET_IP -sV -p111,2049
```

NSE output may list exports, supported versions and the RPC services registered on port 111.

### 2. List the exported shares

```bash
showmount -e TARGET_IP
```

The output shows each exported path and the clients allowed to mount it. On an NFSv4-only server, `showmount` may return nothing because it depends on the mount daemon and rpcbind. In that case, attempt a direct mount.

### 3. Mount a share

```bash
mkdir DIRECTORY
sudo mount -t nfs TARGET_IP:/SHARE DIRECTORY
```

Choose a mount point that is clearly temporary, and unmount the share as soon as enumeration is complete.

### 4. Inspect ownership and permissions

```bash
ls -l DIRECTORY
ls -n DIRECTORY
```

`ls -l` shows owner and group names as they resolve on your own system, which may be misleading. `ls -n` shows the numeric UID and GID the server stores, which is what matters for access checks.

### 5. Unmount

```bash
sudo umount DIRECTORY
```

## What to look for

Review the export options in `/etc/exports` on the server, or infer them from behaviour:

| Option | Meaning |
| --- | --- |
| `rw` | Read and write access |
| `ro` | Read-only access |
| `root_squash` | Maps root (UID 0) to an anonymous user, which limits root access |
| `no_root_squash` | Keeps UID 0 as root on the server, which lets a remote root act as root on shared files |
| `insecure` | Allows requests from ports above 1024 |
| `nohide` | Exposes a filesystem mounted beneath an export as a separate export |
| `no_subtree_check` | Disables subtree checking for performance |

Other points of interest:

- Exports offered to `*` (any host) or to wide address ranges.
- Owners with numeric UIDs that match accounts on the server, indicating sensitive user files.
- Write access to directories that are later executed, served or read by scheduled jobs.

> **Important:** Because the server trusts the UID the client sends, a local account on your system with the same numeric UID can read or write files owned by that UID. Confirm that this use is within scope before testing, and document each identity you assume.
{: .danger }

## Pitfalls

- **Name mapping hides IDs.** Always inspect with `ls -n` before drawing conclusions about ownership.
- **Mount failures** can come from a firewall blocking 2049, a client not on the export list, or an NFS version the client does not negotiate. Check the export list and the version in use.
- **Writes change the target.** Creating files on an export modifies production data. Only write where the scope allows it.
- **Unmounted leftovers.** A forgotten mount keeps a connection open and can confuse later checks. Unmount before moving on.

## Defense and prevention

Export only to specific client addresses, never to `*`. Keep `root_squash` in place, avoid `no_root_squash` and `insecure` unless required, and use `nohide` only deliberately. Where possible, use NFSv4 with Kerberos (`sec=krb5`, `krb5i` or `krb5p`) so that the server authenticates users rather than trusting client-reported IDs. Restrict ports 111 and 2049 with a firewall, and review exports after each change.
