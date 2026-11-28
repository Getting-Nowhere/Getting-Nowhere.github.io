---
layout: page
title: "DnsAdmins"
subtitle: "Load a plugin DLL into the DNS service through the server-level plugin setting, and the risks of doing so"
permalink: /methodology/privesc-windows/dnsadmins/
---

Members of the DnsAdmins group can manage the Windows DNS service. The DNS service supports custom plugin DLLs, and it runs as `NT AUTHORITY\SYSTEM`. On a domain controller or on a server that hosts DNS for the domain, a plugin DLL loaded by the service runs with SYSTEM rights. DnsAdmins membership allows the plugin path to be set, but it does not allow the DNS service to be restarted. The DLL therefore loads at the next service start, which may be a planned or unplanned reboot.

> This attack changes a domain-wide service and must be run with explicit approval. A bad plugin path can stop DNS for the entire environment, and the cleanup steps below are required.
{: .danger }

## Step 1: Confirm group membership

```powershell
whoami /groups
Get-ADGroupMember -Identity DnsAdmins
```

The account must appear in the `DnsAdmins` group. Membership in a nested group is also enough, so check the nested membership as well.

## Step 2: Check the DNS service permissions

A DnsAdmins member does not hold direct rights on the registry key. The DNS service control permissions decide whether the account can start and stop the service. Read them with the SDDL view:

```cmd
sc.exe sdshow DNS
```

Look for an ACE that grants the account, or one of its groups, `RPWP` (start and stop). Membership in DnsAdmins does not by itself grant the right to restart the service. If the account has no start or stop right, the DLL loads only when the server restarts.

## Step 3: Set the plugin path

The `dnscmd` tool sets the `ServerLevelPluginDll` value under the DNS service parameters key. A standard-user attempt fails with access denied, which confirms that the group membership is what matters.

```cmd
dnscmd.exe /config /serverlevelplugindll <path to plugin DLL>
```

The path can be on a network share that the domain controller's machine account can read, so a local path is not required. The DLL is not verified before it is loaded.

## Step 4: Trigger the load

Only a service restart loads the DLL. If the account has start and stop rights on the service, stop and start DNS:

```cmd
sc stop dns
sc start dns
```

Confirm the outcome, such as a new account in the Domain Admins group or a callback to the listener. The notes show `net group "Domain Admins" /domain` for that check.

## Alternative: WPAD record

DnsAdmins can also disable the global query block list and create a WPAD record. Clients that use default proxy discovery then send their web traffic to the attacker-chosen host. This is a traffic interception approach and it has a wider blast radius than the DLL load.

```powershell
Set-DnsServerGlobalQueryBlockList -Enable $false -ComputerName <DNS server>
Add-DnsServerResourceRecordA -Name wpad -ZoneName <zone> -ComputerName <DNS server> -IPv4Address <listener IP>
```

## Cleanup (required)

Until the plugin registry value is removed, the DNS service may fail to start correctly. Remove it straight away after the test:

```cmd
reg query \\<DNS server>\HKLM\SYSTEM\CurrentControlSet\Services\DNS\Parameters
reg delete \\<DNS server>\HKLM\SYSTEM\CurrentControlSet\Services\DNS\Parameters /v ServerLevelPluginDll
sc start dns
sc query dns
```

Then confirm name resolution with `nslookup` against the server and against another host in the domain.

## What to look for

- Non-administrative accounts in DnsAdmins, including through nested groups.
- A DNS service whose control rights are granted to a broad group.
- Domain controllers or DNS servers that load plugins from network shares.

## Pitfalls

- A plugin that does not match the expected entry point can crash the DNS service. Plan for that outcome.
- Restarting DNS on a production domain controller affects every client. Use an approved maintenance window.
- The reboot route depends on the timing of the next restart, which is outside the tester's control.
- Record the exact plugin path and the time of the change for the report.

## Defense

Keep DnsAdmins empty, or limited to named administrators who need it. Restrict the DNS service's control rights to administrators. Set the ServerLevelPluginDll value to be audited, and alert on changes under the DNS Parameters key. Enable the global query block list and keep WPAD disabled where it is not needed. Monitor DNS service start and stop events on domain controllers.
