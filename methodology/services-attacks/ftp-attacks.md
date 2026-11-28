---
layout: page
title: "FTP Attacks"
subtitle: "Anonymous access, brute forcing, bounce scanning and FTP service vulnerabilities"
permalink: /methodology/services-attacks/ftp-attacks/
---

File Transfer Protocol (FTP) moves files between a client and a server, usually on TCP 21. Plain FTP sends credentials and data without encryption and is often misconfigured to allow anonymous logins or uploads. The attack surface is the service configuration and the credentials that protect it, so this page focuses on anonymous access, password attacks and a few protocol-level techniques.

## Workflow

1. Run Nmap default scripts to check for anonymous login and writable directories.
2. Log in anonymously and enumerate the file tree.
3. Download interesting files and look for credentials or configuration data.
4. Test for upload access in writable directories.
5. Brute force or spray credentials if authentication is required.
6. Check the FTP version for known vulnerabilities.

## Enumeration

```bash
sudo nmap -sC -sV -p 21 TARGET_IP
```

The `ftp-anon` script reports whether anonymous login is allowed and lists visible files. Its output is truncated by default; add `--script-args ftp-anon.maxlist=-1` to list every entry. A directory flagged as writable by the script is a candidate for upload testing.

## File transfer commands

```text
get FILE_NAME        download one file
mget *               download multiple files
put LOCAL_FILE       upload one file
mput *.txt           upload multiple files
```

Upload access is only a finding when it is tested in a directory that is not used for testing other vectors. Uploading into web-served directories can chain into remote code execution where the web application runs scripts from that location.

## Password attacks

```bash
medusa -u USERNAME -P /usr/share/wordlists/rockyou.txt -h TARGET_IP -M ftp
```

Medusa iterates the password list for one user until it finds a match. Where the lockout policy is strict, spraying one password across a user list is quieter than brute forcing a single account.

## FTP bounce scanning

An FTP server that accepts the `PORT` command can be used as a relay to reach hosts that the attacker cannot access directly. Nmap automates this with `-b`.

```bash
nmap -Pn -n -p80 -b USERNAME:PASSWORD@TARGET_IP INTERNAL_IP
```

> The bounce scan reaches internal hosts through the FTP server, so the results show what the FTP host can reach, not what the attacker can reach. Note the source of each result.
{: .info }

## Known service vulnerability

Some versions of CoreFTP before build 727 mishandle HTTP `PUT` requests, which allows authenticated path traversal and arbitrary file writes. A proof of concept only confirms that a file can be written outside the intended directory.

```bash
curl -k -X PUT -H "Host: TARGET_IP" --basic -u USERNAME:PASSWORD --data-binary "PoC" --path-as-is https://TARGET_IP/../../../../../../FILE_NAME
```

## What to look for

- `ftp-anon` reporting anonymous login, especially with writable directories.
- Configuration files, backups or scripts containing credentials.
- Writable folders that the web server also serves.
- Old FTP server versions reported by the banner.

## Pitfalls

- Anonymous access can be enabled but restricted to an empty chroot. Check the directory listing before assuming content exists.
- Repeated authentication failures may trigger lockouts or banning on the server side.
- Bounce scanning is slow and unreliable on servers that rewrite PORT commands.

> A writable anonymous FTP directory is a common path to web shell placement. Confirm the directory mapping before uploading anything.
{: .warning }

## Defense and prevention

Disable anonymous access unless it is required, use SFTP or FTPS instead of plain FTP, restrict writable directories, place users in chroot jails, patch the server, and restrict outbound data connections. See the [services prevention](/methodology/services-attacks/prevention/) page.
