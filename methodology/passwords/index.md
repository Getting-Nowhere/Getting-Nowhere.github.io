---
layout: page
title: "Password Attacks"
subtitle: "Section index: credential hunting, extraction, remote guessing and offline cracking"
permalink: /methodology/passwords/
---

This section covers how credentials are obtained and recovered during an assessment. It starts with the fundamentals of hashing and cracking, then moves through remote password attacks against live services, offline cracking tools, cracking protected files, and the places credentials are stored on Linux and Windows hosts and on the network. Each page focuses on one technique, with commands, decision points and defensive notes. Credentials recovered here are typically reused in the services, lateral movement and privilege escalation phases of an engagement.

## Checklist

☐ Identify every hash, encrypted file and credential store that is in scope
☐ Hunt for plaintext credentials on hosts and shares before cracking anything
☐ Check the password policy and lockout threshold before any remote attack
☐ Match each hash to its cracking mode before running Hashcat or John
☐ Record each recovered credential with its source, host and validity
☐ Use the prevention page to support credential-related remediation advice

## Pages in this section

- [Password attack overview](/methodology/passwords/password-attack-overview/)
- [Remote password attacks](/methodology/passwords/remote-password-attacks/)
- [Hashcat](/methodology/passwords/hashcat/)
- [John the Ripper](/methodology/passwords/john-the-ripper/)
- [Cracking protected files](/methodology/passwords/cracking-protected-files/)
- [Linux credential hunting](/methodology/passwords/linux-credential-hunting/)
- [Linux authentication process](/methodology/passwords/linux-authentication-process/)
- [Windows credential hunting](/methodology/passwords/windows-credential-hunting/)
- [LSASS attacks](/methodology/passwords/lsass-attacks/)
- [SAM, SYSTEM and SECURITY](/methodology/passwords/sam-system-security/)
- [NTDS.dit](/methodology/passwords/ntds-dit/)
- [Windows Credential Manager](/methodology/passwords/windows-credential-manager/)
- [Network credential hunting](/methodology/passwords/network-credential-hunting/)
- [Password prevention](/methodology/passwords/prevention/)
