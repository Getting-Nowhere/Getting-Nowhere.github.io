---
layout: page
title: "FTP and TFTP"
subtitle: "Anonymous access, writable shares and cleartext file transfer on ports 21 and 69"
permalink: /methodology/service-enumeration/ftp/
---

## Purpose

FTP transfers files over TCP and is often configured with anonymous access, weak permissions or no encryption. TFTP is a simpler UDP protocol with no authentication at all. This page covers how to identify both services, test anonymous and writable access, review the server configuration and recognise the risks each one carries.

## Background

FTP uses two channels. The client connects to the control port 21 to send commands, and data moves over a separate data connection:

- **Active mode:** the server opens the data connection back to the client from port 20. This struggles with client-side firewalls and NAT.
- **Passive mode:** the server opens a high port for the data connection and the client connects to it. This is used when external connections to the client are blocked.

FTP sends commands and credentials in cleartext unless it is wrapped in TLS, so it can be sniffed on the wire. TFTP runs over UDP port 69, has no authentication, and offers only a small set of commands (`get`, `put`, `connect`, `status`, `verbose`, `quit`).

## Enumeration steps

### 1. Scan and fingerprint

```bash
sudo nmap --script-updatedb
sudo nmap -sV -p21 -sC -A TARGET_IP
find / -type f -name "ftp*" 2>/dev/null | grep scripts
```

Update the NSE database first so the latest FTP scripts are available. The `find` command locates local scripts if you need a specific one.

### 2. Grab the banner

```bash
nc -nv TARGET_IP 21
telnet TARGET_IP 21
```

The banner often names the server software and version. Use `USER anonymous` at the prompt to see how the server responds to anonymous login.

### 3. Check for TLS

```bash
openssl s_client -connect TARGET_IP:21 -starttls ftp
```

If the server offers STARTTLS, the certificate details (subject, issuer, names) can reveal hostnames and organisational information. A self-signed certificate is a configuration finding.

### 4. Test anonymous access and download

```text
ftp TARGET_IP
Name: anonymous
Password: (any value, or none, depending on configuration)
ftp> ls
ftp> get FILENAME
```

To mirror everything the anonymous user can read, use wget in recursive mode:

```bash
wget -m --no-passive-ftp ftp://anonymous:PASSWORD@TARGET_IP
```

The notes use `--no-passive`, which is an unambiguous abbreviation of `--no-passive-ftp`. The full form is clearer in reports.

### 5. Test TFTP

```text
tftp TARGET_IP
tftp> status
tftp> verbose
tftp> get FILENAME
tftp> put FILENAME
```

Attempt `put` only if the scope explicitly allows writes, and record exactly what was written.

### 6. Review configuration (with host access)

```bash
cat /etc/vsftpd.conf | grep -v "#"
cat /etc/ftpusers
```

The `ftpusers` file lists accounts denied FTP login. Compare it against the accounts that actually exist.

## What to look for

| Setting | Risk |
| --- | --- |
| `anonymous_enable=YES` | Unauthenticated access to the file tree |
| `anon_upload_enable=YES`, `anon_mkdir_write_enable=YES` | Anonymous users can plant or stage files |
| `no_anon_password=YES` | Anonymous login accepted without a password check |
| `anon_root=` | Points anonymous users at a directory that may hold sensitive data |
| `write_enable=YES` | Enables STOR, DELE, RNFR, RNTO, MKD, RMD, APPE and SITE commands |
| `chroot_local_user=NO` | Local users can browse beyond their home directory |
| `ls_recurse_enable=YES` | Recursive listings reveal the whole tree in one request |

> **Warning:** A writable anonymous directory served by a web server or scheduled task can turn an upload into code execution. Confirm scope and report writable locations immediately.
{: .warning }

## Pitfalls

- **Active versus passive mode** changes which ports must be reachable. If a data transfer hangs, switch modes before concluding that files are unavailable.
- **Firewalls** may allow port 21 while blocking the passive data range. Test a directory listing, not just the login.
- **Recursive downloads** can pull very large trees. Set a size or scope limit before running a mirror.
- **Cleartext credentials** on FTP can be captured on the wire. Treat any credentials seen in traffic as sensitive and handle them as the scope requires.
- **Self-signed TLS** will fail verification in many clients. Note the warning rather than disabling checks silently.

## Defense and prevention

Disable anonymous access unless it is required, and never allow anonymous uploads to a directory that is served or executed. Prefer SFTP (over SSH) or FTPS with valid certificates. Confine users to their home directories with `chroot_local_user`, use `ftpusers` to deny service accounts, and disable TFTP on hosts that do not need it.
