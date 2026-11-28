---
layout: page
title: "Server Operators"
subtitle: "Modify the configuration of a SYSTEM service that Server Operators can control, and read the domain hashes that follow"
permalink: /methodology/privesc-windows/server-operators/
---

Server Operators administer servers without holding Domain Admin rights. They can log on locally to servers, including domain controllers, and they hold the backup and restore rights. They also have full control of certain services. A service that runs as LocalSystem and grants `SERVICE_ALL_ACCESS` to Server Operators can have its configuration changed, which gives code execution as SYSTEM on the host. The notes use the AppReadiness service as the example.

## Step 1: Confirm the group

```cmd
whoami /groups
net localgroup "Server Operators"
```

## Step 2: Find services that the group can control

Start with the service configuration. A LocalSystem service that starts on demand is a candidate:

```cmd
sc qc <service name>
```

Look for `SERVICE_START_NAME : LocalSystem` and note the binary path.

Then check the service ACL. The Sysinternals PsService tool prints the access rights per principal:

```cmd
PsService.exe security <service name>
```

If `BUILTIN\Server Operators` is listed with `All`, the group holds `SERVICE_ALL_ACCESS`. That is full control of the service, including its binary path.

## Step 3: Confirm the local admin group

```cmd
net localgroup Administrators
```

Record the current members before any change. The notes check this after the change, to confirm the result.

## Step 4: Change the service and start it

The route is to set the service's binary path to a command that adds the current account to the local Administrators group. The `sc config` syntax is:

```cmd
sc config <service name> binPath= "<command to run>"
sc start <service name>
```

The start call usually returns error 1053. The Service Control Manager expects the started binary to register with it within about 30 seconds. A plain command does not do that, so the start is reported as failed. The command still runs, and the account is added before the timeout. Check the result, not the error.

```cmd
net localgroup Administrators
```

## Step 5: Use the admin rights

With local admin on a domain controller, the account can read the domain hashes. The notes show a check with a SMB credential validator, followed by `secretsdump.py` limited to one account:

```text
secretsdump.py <DOMAIN>/<USERNAME>@<TARGET_IP> -just-dc-user administrator
```

## Cleanup (required)

Restore the original service binary path and the original group membership:

```cmd
sc config <service name> binPath= "<original binary path>"
net localgroup Administrators <USERNAME> /delete
```

Confirm the service starts normally, and record both changes in the report.

## What to look for

- Non-administrator accounts in Server Operators, including on domain controllers.
- LocalSystem services whose ACL grants `All` or `SERVICE_CHANGE_CONFIG` to Server Operators or to a wider group.
- Services with unquoted or writable binary paths, which are covered in the Weak Permissions page.

## Pitfalls

- A change to a live service affects its users. Make the change in a maintenance window, and keep the original value in the notes.
- A service that fails to start after the change may still have run the command. Do not treat error 1053 as a failed test, and do not leave a changed service in place.
- Adding a user to Administrators on a domain controller changes the most sensitive group in the domain. Remove the user straight after the proof.

## Defense

Keep Server Operators empty except for named server administrators, and do not allow them to log on to domain controllers. Restrict service ACLs so that only administrators can change service configuration. Audit changes to service configuration by enabling object access auditing on the service registry keys under `HKLM\SYSTEM\CurrentControlSet\Services`, and alert on new members of the local Administrators group.
