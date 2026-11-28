---
layout: page
title: "Linux Remote Management"
subtitle: "SSH, rsync and legacy r-services on Linux hosts"
permalink: /methodology/service-enumeration/remote-management-linux/
---

## Purpose

Linux hosts are commonly administered remotely through SSH, and they may also expose rsync for file synchronisation or legacy r-services for trusted remote commands. Each of these can reveal software versions, accounts, file trees and trust relationships, and each has its own weak configurations. This page covers the enumeration steps for all three, grouped by protocol.

## 1. SSH (port 22)

### Background

SSH runs on most operating systems, including Windows through OpenSSH. Protocol version 1 is obsolete and vulnerable to man-in-the-middle attacks, so any server still offering it is a finding. OpenSSH supports six authentication methods: password, public key, host-based, keyboard-interactive, challenge-response and GSSAPI. Public-key authentication relies on a key pair in which the server holds the public key and the user holds the private key, often protected by a passphrase.

### Steps

**1.1 Audit the algorithms and banner**

```bash
ssh-audit TARGET_IP
```

The first line of output shows the server banner. The report flags weak algorithms and known issues, such as CVE-2020-14145, which concerns man-in-the-middle exposure in certain configurations.

**1.2 Test which authentication methods are offered**

```bash
ssh -v USERNAME@TARGET_IP -o PreferredAuthentications=password
```

The verbose output lists the methods the server will continue with, for example `publickey,password,keyboard-interactive`. Confirm the username before testing any password.

**1.3 Review sshd_config (with host access)**

```bash
cat /etc/ssh/sshd_config | grep -v "#" | sed -r '/^\s*$/d'
```

## 2. rsync (port 873)

### Background

rsync copies files locally or remotely and transfers only the differences between a source file and an older version. It listens on TCP 873 and can also run over SSH. Its daemon mode can expose named modules (shares) without authentication.

### Steps

**2.1 Identify the service**

```bash
sudo nmap -sV -p 873 TARGET_IP
```

**2.2 List modules manually**

```bash
nc -nv TARGET_IP 873
```

After the banner exchange, send `#list`. Each module name and its description is printed, followed by `@RSYNCD: EXIT`.

**2.3 Inspect a module and copy it**

```bash
rsync -av --list-only rsync://TARGET_IP/SHARE
rsync -av rsync://TARGET_IP/SHARE ./LOCAL_DIRECTORY
```

The listing shows permissions, sizes and dates without transferring data. Review it before syncing, because a module may contain hidden directories such as `.ssh` or configuration files with credentials.

## 3. R-services (ports 512 to 514)

### Background

The r-services (rcp, rsh, rexec and rlogin) are legacy remote-command tools. They are rarely appropriate today because they send credentials in cleartext or rely on host trust rather than authentication.

| Command | Daemon | Port | Function |
| --- | --- | --- | --- |
| rcp | rshd | 514 (TCP) | Copies files between hosts without warning before overwriting |
| rsh | rshd | 514 (TCP) | Opens a shell using trust entries rather than a login |
| rexec | rexecd | 512 (TCP) | Runs a command with a username and password sent in cleartext |
| rlogin | rlogind | 513 (TCP) | Logs in to a Unix-like host, with authentication overridden by trust entries |

**3.1 Check trust files (with host access)**

```bash
cat /etc/hosts.equiv
cat ~/.rhosts
```

A line in `hosts.equiv` has the form `<hostname> <local username>`. A `+ +` entry trusts every host and every user.

**3.2 Test trusted access**

```bash
rlogin TARGET_IP -l USERNAME
rusers -al TARGET_IP
```

`rusers` lists users currently logged in to a remote host, which helps confirm that the service is in use.

## What to look for

- SSH: password authentication enabled, `PermitRootLogin yes`, `PermitEmptyPasswords yes`, legacy protocol versions, X11 or TCP forwarding enabled without need, and root or service accounts with weak passwords.
- rsync: anonymous modules that expose `.ssh`, scripts or configuration files.
- R-services: any open port 512 to 514, `hosts.equiv` or `.rhosts` entries that trust broad host or user patterns.

> A `+ +` entry in `hosts.equiv` allows any host to log in as any user without a password. Record it as a critical trust finding.
{: .danger }

## Pitfalls

- **Brute force** against SSH can trigger fail2ban or account lockouts. Confirm the username and limit attempts.
- **Verbose output** from `ssh -v` is useful for method discovery but noisy in logs. Expect it to be recorded.
- **rsync syncs everything** in a module by default. Review the listing and copy only what the scope needs.
- **r-service ports** are often filtered by modern firewalls. A closed port does not prove the trust files are absent.
- **Host-based trust** depends on the source address and name resolution. A test from an unexpected address can fail for reasons unrelated to credentials.

## Defense and prevention

For SSH, disable password logins in favour of keys, set `PermitRootLogin no`, disable empty passwords and legacy protocols, and turn off X11 and TCP forwarding unless required. Restrict logins with `AllowUsers` or `AllowGroups`. For rsync, require authentication on every module and make modules read-only where possible. Remove the r-services and their trust files entirely, and never place `+ +` entries in `hosts.equiv`.
