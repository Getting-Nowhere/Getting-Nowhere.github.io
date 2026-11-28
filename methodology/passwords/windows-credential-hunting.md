---
layout: page
title: "Windows Credential Hunting"
subtitle: "Finding plaintext credentials in files, scripts, directory fields and password managers"
permalink: /methodology/passwords/windows-credential-hunting/
---

Credential hunting on a Windows host means searching the file system, scripts, configuration files, directory attributes and application stores for plaintext or recoverable passwords. Plaintext credentials are often left in scripts, deployment files, Group Policy Preferences, `unattend.xml` answer files and spreadsheets. This page covers the search terms, the built-in and third-party tools, and the locations most often worth checking.

## Search terms

Start with words that appear next to values: `passw`, `pass`, `pwd`, `user`, `login`, `cred`, `secret`, `key`, `token`, `configuration`, `dbcredential` and `dbpassword`. Localise the list to the target. A German organisation may use "Benutzer" rather than "User".

## Workflow

1. Run a broad keyword search over user profiles and shares.
2. Check the known credential locations listed below.
3. Run a credential-focused tool to cover browsers, mail clients, memory and Windows stores.
4. Test each finding against the services in scope and record its source.

## Keyword search

```cmd
findstr /SIM /C:"password" *.txt *.ini *.cfg *.config *.xml *.git *.ps1 *.yml
```

```powershell
Get-ChildItem -Recurse -Path C:\Users -Include *.txt,*.ini,*.cfg,*.xml,*.ps1,*.bat -File | Select-String -Pattern "passw" -List
```

Target file extensions that frequently store settings include `.ini`, `.cfg`, `.env`, `.xlsx`, `.ps1` and `.bat`. Files named `pass.txt`, `passwords.docx` or `passwords.xlsx` are common on user systems and SharePoint sites.

## Known credential locations

- Group Policy Preferences and scripts in the SYSVOL share. Older preferences files can store encrypted passwords whose key is public, and Microsoft's MS14-025 stopped new GPOs from storing such passwords, but existing files can remain.
- Scripts on IT shares and deployment folders.
- `web.config` files on development machines and IT shares, which often hold database connection strings.
- `unattend.xml` and similar answer files used during installation.
- Description fields on Active Directory user or computer objects.
- KeePass databases on user systems or shares, when the master password is known or can be cracked.

## LaZagne

LaZagne is a credential recovery tool that covers browsers, chat and mail clients, memory, sysadmin tools, Windows stores and Wi-Fi profiles. Its module list includes browsers, chats, mails, memory, sysadmin, windows and wifi.

```cmd
LaZagne.exe all
```

Run the tool with the most specific module when the scope is narrow. Its output contains plaintext values, so store the results in the engagement folder.

> Browser passwords are encrypted but recoverable with the user's context. Tools such as firefox_decrypt and decrypt-chrome-passwords handle the common browsers.
{: .info }

## What to look for

- Plaintext passwords in scripts that map drives or run services.
- Connection strings in `web.config` or application settings.
- Service account credentials in deployment or automation files.
- Credentials in spreadsheets or documents on shared drives.
- A consistent password pattern across several files, which hints at other accounts.

## Pitfalls

- Broad searches over shares return large amounts of noise. Narrow the search to likely shares first.
- Credentials found in old files may be expired. Verify before reporting them as current.
- Group Policy Preferences passwords are reversible with publicly documented keys. Treat them as cleartext in reporting.

> Handle recovered credentials as sensitive data. Do not paste them into shared channels or tickets.
{: .warning }

## Defense and prevention

Keep credentials out of scripts and configuration files, use managed secrets stores, remove legacy Group Policy Preferences passwords, delete unattended-install answer files after use, and audit shares for files containing credentials. See the [password prevention](/methodology/passwords/prevention/) page.
