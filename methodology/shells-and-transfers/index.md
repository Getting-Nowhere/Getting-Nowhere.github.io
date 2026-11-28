---
layout: page
title: "Shells and File Transfers"
subtitle: "Section index: getting interactive access and moving tools onto and off target hosts"
permalink: /methodology/shells-and-transfers/
---

This section covers the two things that follow almost every foothold: getting an interactive shell that the target can actually sustain, and moving files (tools, payloads, loot) between our systems and the target. Work through it in order. Choose the shell direction based on what the target is allowed to reach, generate or select a payload that matches the platform, pick a transfer method that the target's protocols and policies will permit, and keep the detection points in mind throughout.

## Checklist

- ☐ Confirm the target OS, architecture and available interpreters before choosing a payload
- ☐ Check outbound and inbound reachability to decide between a reverse and a bind shell
- ☐ Start the listener before triggering any payload
- ☐ Prefer stageless payloads when a staged shell is unstable
- ☐ Choose a transfer method the target can use (HTTP, SMB, WebDAV, base64 over a shell, and so on)
- ☐ Verify every transferred file with a hash before trusting it
- ☐ Record which methods succeeded and which were blocked, for the report

## Pages in this section

- [Reverse and Bind Shells](/methodology/shells-and-transfers/reverse-and-bind-shells/)
- [Payload Basics](/methodology/shells-and-transfers/payload-basics/)
- [Linux Shells](/methodology/shells-and-transfers/linux-shells/)
- [Windows Shells](/methodology/shells-and-transfers/windows-shells/)
- [Web Shells](/methodology/shells-and-transfers/web-shells/)
- [File Transfers: Linux](/methodology/shells-and-transfers/file-transfers-linux/)
- [File Transfers: Windows](/methodology/shells-and-transfers/file-transfers-windows/)
- [Transferring Files with Code](/methodology/shells-and-transfers/transfers-with-code/)
- [Catching Files and Living off the Land](/methodology/shells-and-transfers/catching-files-lolbins/)
- [Metasploit](/methodology/shells-and-transfers/metasploit/)
- [Shell Detection and Mitigation](/methodology/shells-and-transfers/shell-detection-mitigation/)
