---
layout: page
title: "Microsoft SQL Server"
subtitle: "Instance discovery, authentication and T-SQL enumeration on port 1433"
permalink: /methodology/service-enumeration/mssql/
---

## Purpose

Microsoft SQL Server is a relational database service, most often found on Windows and integrated with Active Directory. Its authentication and permission model is detailed, and misconfigurations (weak `sa` credentials, excessive roles, enabled command execution, linked servers) can lead directly to host compromise. This page covers how to identify an instance, test authentication, enumerate databases and permissions, and recognise the decision points that matter.

## Background

- The default TCP port is 1433, and named or dynamic instances may use other ports resolved through the SQL Browser service.
- Default system databases are `master` (instance-wide metadata), `model` (template for new databases), `msdb` (SQL Server Agent jobs and alerts), `tempdb` (temporary objects) and `resource` (read-only system objects).
- Windows authentication delegates logins to the local SAM database or to the domain controller. SQL authentication uses logins defined inside SQL Server.
- SQL Server Management Studio (SSMS) is often installed on workstations as well as servers. Saved connection profiles on those machines can expose working credentials.

## Enumeration steps

### 1. Fingerprint the instance

```bash
sudo nmap -sV -p 1433 --script ms-sql-info,ms-sql-empty-password,ms-sql-xp-cmdshell,ms-sql-config,ms-sql-ntlm-info,ms-sql-tables,ms-sql-hasdbaccess,ms-sql-dac,ms-sql-dump-hashes --script-args mssql.instance-port=1433,mssql.username=USERNAME,mssql.password=PASSWORD,mssql.instance-name=MSSQLSERVER TARGET_IP
```

The `ms-sql-info` output reveals the hostname, instance name, version and whether named pipes are enabled. Supply credentials only when they are in scope. The scripts that require authentication will fail without them.

### 2. Confirm with Metasploit

```text
use auxiliary/scanner/mssql/mssql_ping
set RHOSTS TARGET_IP
run
```

### 3. Connect with Impacket

```bash
impacket-mssqlclient USERNAME@TARGET_IP
impacket-mssqlclient USERNAME@TARGET_IP -windows-auth
impacket-mssqlclient sa@TARGET_IP
```

The first form uses SQL authentication and the second uses Windows authentication. Each prompts for the password. Test the `sa` account only as the scope permits, and record the result either way.

### 4. Enumerate version, identity and databases

```sql
SELECT @@version;
SELECT @@SERVERNAME;
SELECT HOST_NAME();
SELECT SERVERPROPERTY('MachineName');
SELECT SYSTEM_USER;
SELECT user_name();
SELECT name FROM sys.databases;
EXEC sp_databases;
USE DATABASE_NAME;
SELECT * FROM INFORMATION_SCHEMA.TABLES;
SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TABLE_NAME';
```

### 5. Check permissions and impersonation

```sql
SELECT IS_SRVROLEMEMBER('sysadmin');
SELECT sp.name, sp.type_desc FROM sys.server_principals sp;
SELECT DISTINCT b.name FROM sys.server_permissions a INNER JOIN sys.server_principals b ON a.grantee_principal_id = b.principal_id WHERE a.permission_name = 'IMPERSONATE';
SELECT * FROM sys.servers;
EXEC sp_linkedservers;
```

`IS_SRVROLEMEMBER('sysadmin')` returns 1 when the current login is a sysadmin. The impersonation query lists the principals that hold IMPERSONATE permission, which means the current user may be able to act as them.

### 6. Command execution (only where authorised)

```sql
enable_xp_cmdshell
xp_cmdshell whoami
EXEC master..xp_cmdshell 'whoami';
```

Enabling `xp_cmdshell` changes server configuration. Use it only when the scope permits it, and disable it again when testing ends.

## What to look for

- Sysadmin membership, or an IMPERSONATE permission that leads to a sysadmin login.
- Linked servers, which can extend access to other instances.
- Active `sa` or other default-named accounts with weak passwords.
- Databases that hold application data, credentials or personal information.
- Connections without encryption, or with self-signed certificates.

> A linked server or saved SSMS profile can reach a database that the current login cannot reach directly. Record each connection path, because it often extends the scope of access.
{: .tip }

## Pitfalls

- **Forced authentication.** Procedures such as `xp_dirtree` and `xp_fileexist` cause the server to authenticate to a remote UNC path. Capturing the NTLM exchange requires an SMB listener under your control and explicit approval.
- **Persistence is not enumeration.** Creating logins, adding sysadmin members or other backdoor steps change the target and are outside an enumeration phase. Do not perform them as part of this page.
- **Encryption is optional by default.** Clients may connect without encryption, and self-signed certificates can be spoofed, so treat connection-level findings as risks rather than proof of compromise.
- **Lockouts.** Default-login checks against `sa` can trigger lockout policies. Test one known credential before any guessing.
- **Named pipes** are a separate exposure. Check whether they are enabled, since they change which network paths reach the instance.

## Defense and prevention

Disable or rename the `sa` account and set a strong password on any account that remains. Grant least privilege, review sysadmin and IMPERSONATE grants regularly, and keep `xp_cmdshell` disabled unless it is required. Remove unused linked servers, enforce encrypted connections with trusted certificates, restrict network access to port 1433, and do not store credentials in client profiles.
