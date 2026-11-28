---
layout: page
title: "Pillaging"
subtitle: "Collect information from a compromised host: installed applications, stored configurations, sessions and backups"
permalink: /methodology/privesc-windows/pillaging/
---

Pillaging is the systematic collection of information from a compromised host. The data may be personal, commercial or technical, and each item can unlock a credential, a session or a route to a more privileged system. This page organises the search by data source and shows how to recover the most useful items.

## Data sources

- Installed applications and their configuration
- Installed services, such as file shares, databases, directory services, certificate authorities, source control, virtualisation and backup systems
- Sensitive data, such as keystrokes, screen captures, network captures and past audit reports
- User information: history files, documents with names such as passwords or pass, browsers, chat clients and roles

## Workflow

### 1. Installed applications

```cmd
C:\htb> dir "C:\Program Files"
C:\htb> dir "C:\Program Files (x86)"
```

```powershell
PS C:\htb> $INSTALLED = Get-ItemProperty HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\* | Select-Object DisplayName, DisplayVersion, InstallLocation
PS C:\htb> $INSTALLED += Get-ItemProperty HKLM:\Software\Wow6432Node\Microsoft\Windows\CurrentVersion\Uninstall\* | Select-Object DisplayName, DisplayVersion, InstallLocation
PS C:\htb> $INSTALLED | ?{ $_.DisplayName -ne $null } | sort-object -Property DisplayName -Unique | Format-Table -AutoSize
```

Each installed product is a lead. Remote management tools, VPN clients, password utilities and chat clients usually store configuration, and many store credentials.

### 2. Remote management configuration

Some remote access tools save connection details to a configuration file in the user profile. One example is mRemoteNG, which stores connection entries in an XML file under the profile's AppData folder. Each entry has a Username, a Hostname and an encrypted Password attribute. The encryption uses a master password. If no custom master password is set, the stored values can be decrypted with publicly available tooling. If a custom master password is set, it must be recovered or guessed before decryption succeeds.

```powershell
PS C:\htb> ls C:\Users\USERNAME\AppData\Roaming\mRemoteNG
```

### 3. Browser and chat session data

Firefox keeps cookies in a SQLite database in the profile folder. The database may be locked while the browser runs, so copy it with a tool that can read locked files:

```powershell
PS C:\htb> copy $env:APPDATA\Mozilla\Firefox\Profiles\*.default-release\cookies.sqlite .
```

```cmd
C:\htb> esentutl.exe /y "PATH_TO_COOKIES\cookies.sqlite" /d "DEST\cookies.sqlite" /o
```

Chromium-based browsers store the same kind of data, but the cookie values are protected by DPAPI and must be decrypted in the user's context. Chat clients such as Slack keep an authentication token in a cookie. A session token replayed in a browser can authenticate as the user, bypassing MFA at login. Use this only where the engagement allows access to the user's messages.

### 4. Clipboard

Users paste credentials and one-time codes from password managers. A clipboard logger run in the user's session can capture them. Run it only as long as needed and only where the rules of engagement permit monitoring of user activity.

### 5. Backup servers

Backup software often holds complete copies of file systems. Identify the repository and its password source. For example, restic reads the repository password from the RESTIC_PASSWORD environment variable when it is set.

```powershell
PS C:\htb> $env:RESTIC_PASSWORD = 'PASSWORD'
PS C:\htb> restic.exe -r E:\REPO snapshots
PS C:\htb> restic.exe -r E:\REPO restore SNAPSHOT_ID --target C:\Restore
```

Restored backups must be searched for the same things as a live system: SAM and SYSTEM hives, web.config files, SSH keys, and configuration files. Backup repositories are a frequent source of high-value secrets.

## What to look for

- Configuration files with encrypted or plaintext credentials for other hosts.
- Session cookies or tokens for internal web applications and chat tools.
- Backup repositories that contain system or application data for privileged systems.
- Documents, notes and history files that describe the environment.

## Pitfalls

- Pillaging produces a large amount of personal data. Store it securely, collect only what the objective needs, and document what was reviewed.
- Copying live databases can disrupt the application. Prefer read-only copies.
- Stolen session tokens can trigger alerts on the service side. Coordinate with the client.
- Decryption tooling depends on version. Test on a copy before relying on the output.

## Defense

Keep configuration files of remote access and password tools protected with a strong master password, and avoid saving credentials in them. Restrict browser and chat storage through policy, enable session binding and short token lifetimes, and encrypt and access-control backup repositories with separate secrets. Review installed software on each host and remove what is not required.
