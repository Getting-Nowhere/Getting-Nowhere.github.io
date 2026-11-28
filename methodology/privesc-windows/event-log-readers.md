---
layout: page
title: "Event Log Readers"
subtitle: "Search event logs for command lines that contain passwords, and know which logs a reader can open"
permalink: /methodology/privesc-windows/event-log-readers/
---

When process creation auditing with command line logging is enabled, Windows writes event 4688 to the Security log. Each entry records the full command line. Many tools take passwords as parameters, so those passwords appear in the log in clear text. Members of the Event Log Readers group can query local event logs. Administrators sometimes add developers or support staff to this group so they can troubleshoot without full admin rights. That makes it a credential source as well as a privilege.

## Step 1: Confirm group membership

```cmd
whoami /groups
net localgroup "Event Log Readers"
```

## Step 2: Search the Security log with wevtutil

`wevtutil` reads events from the command line. The `/rd:true` flag returns the newest events first, and `/f:text` makes the output readable. Filter on the parameter name that the command line uses:

```cmd
wevtutil qe Security /rd:true /f:text | findstr /i "/user"
```

Use a parameter name that matches the tool in use. Common examples are `/user`, `/password`, `-p`, `--password` and `-u`.

To query a remote host, pass the server name and alternate credentials:

```cmd
wevtutil qe Security /rd:true /f:text /r:<server> /u:<USERNAME> /p:<PASSWORD> | findstr /i "/user"
```

Supplying alternate credentials on the command line leaves them in the shell history. Use the stored credentials of the tester if possible, and record the exposure.

## Step 3: Filter with PowerShell

`Get-WinEvent` filters the same events by ID and by property. Event 4688 is the process creation event, and the command line is in one of its properties:

```powershell
Get-WinEvent -LogName Security |
  Where-Object { $_.Id -eq 4688 -and $_.Properties[8].Value -like '*/user*' } |
  Select-Object @{Name='CommandLine';Expression={$_.Properties[8].Value}}
```

The property index can differ between Windows builds. Confirm it on the target by printing one event before filtering.

Use `-Credential` to run the cmdlet under another account when the scope allows it.

## Other logs to check

The PowerShell Operational log can contain sensitive content when script block or module logging is enabled. This log is readable by unprivileged users on many builds, so check it even when the Security log is not accessible.

```powershell
Get-WinEvent -LogName 'Microsoft-Windows-PowerShell/Operational' -MaxEvents 200
```

## What to look for

- Command lines with `/user`, `/password`, `-p`, `--password` or similar switches.
- Connection strings and `net use` commands that include credentials.
- Scripts that log their own secrets at a debug level.

## Pitfalls

- Membership in Event Log Readers is not always sufficient for `Get-WinEvent` on the Security log. The notes state that the cmdlet needs administrator rights or an adjusted ACL on the Security log registry key. Test `wevtutil` first, and check the access before reporting that the path failed.
- Event logs are large. Filter by time and by event ID to keep the search fast and the output small.
- Credentials found in logs are often stale. Test each one only where the scope allows, and record which account it belongs to.

## Defense

Keep Event Log Readers to a short list of monitoring accounts. Avoid passing secrets on the command line. Where auditing of command lines is needed, restrict the Security log to administrators and use a secure logging pipeline with access controls. Review the PowerShell Operational log for secrets and disable logging of sensitive script blocks. Rotate any password that has appeared in a command line.
