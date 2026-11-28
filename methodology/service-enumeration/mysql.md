---
layout: page
title: "MySQL"
subtitle: "Server discovery, authentication checks and schema enumeration on port 3306"
permalink: /methodology/service-enumeration/mysql/
---

## Purpose

MySQL is an open-source relational database that follows a client-server model. It is common in web stacks such as LAMP and is frequently reachable from internal networks and sometimes from the internet. This page covers how to identify a MySQL server, verify authentication results, enumerate databases and tables once access is granted, and read the configuration that controls exposure.

## Background

- Clients connect to the server over TCP (default port 3306) or a local socket.
- Access rights are granted per account and per source host. The same username can therefore behave differently depending on where the connection originates.
- The `sys` schema holds views and metadata that simplify administration. `information_schema` holds the metadata for every database on the server.

## Enumeration steps

### 1. Review the configuration (with host access)

```bash
cat /etc/mysql/mysql.conf.d/mysqld.cnf | grep -v "#" | sed -r '/^\s*$/d'
```

Key settings include `port`, `bind-address`, `user` (the account the service runs as), `datadir`, `skip-name-resolve`, `secure_file_priv` and `admin_address`.

### 2. Scan for the service and its scripts

```bash
sudo nmap TARGET_IP -sV -sC -p3306 --script "mysql*"
```

The script names are quoted so that the shell does not expand `mysql*` against local filenames. NSE output includes version, protocol, auth plugin and candidate accounts. Treat each claim as a hypothesis to verify.

### 3. Verify authentication results manually

```bash
mysql -u root -h TARGET_IP
mysql -u USERNAME -pPASSWORD -h TARGET_IP
```

Note that `-p` is written directly before the password with no space. An `ERROR 1045 (28000): Access denied` response with the client source address shown confirms that the server is reachable and that the account requires credentials.

### 4. Enumerate databases and tables

```sql
show databases;
use DATABASE_NAME;
show tables;
show columns from TABLE_NAME;
select * from TABLE_NAME;
select * from TABLE_NAME where COLUMN_NAME = 'VALUE';
use sys;
```

Use `information_schema` to list the same metadata without changing context:

```sql
SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema NOT IN ('mysql', 'information_schema', 'performance_schema', 'sys');
```

## What to look for

| Setting or finding | Why it matters |
| --- | --- |
| `bind-address` set to 0.0.0.0 or a public address | Server accepts connections from networks that should not reach it |
| `skip-name-resolve` absent | Host-based grants resolve names, which can change which rules apply |
| `secure_file_priv` empty or permissive | Import and export operations can read or write files on the host |
| `debug` and `sql_warnings` enabled | Verbose output can reveal query details and paths |
| Accounts with empty passwords or host wildcards | Direct access without a meaningful credential |
| Application databases with credentials in plain tables | Reuse of credentials across services |

> If the nmap script reports an empty-password root account, confirm it manually. A server that returns an access denied error for that login does not have an empty root password, so the script result is a false positive.
{: .warning }

## Pitfalls

- **False positives.** NSE scripts can report results the server does not support. Verify every finding by logging in or observing the server response.
- **Host-based grants.** The account `root` may be allowed only from localhost. A denial from a remote address does not mean the account is absent.
- **Brute-force volume.** The mysql-brute and mysql-enum scripts send many guesses. Limit their scope and watch for lockout or rate-limit behaviour.
- **Plain-text configuration.** Passwords in configuration files are a host finding, but they are not valid for remote login unless the account is confirmed.
- **Unquoted wildcards.** Passing `mysql*` to nmap without quotes can expand against local filenames and change the scan.

## Defense and prevention

Bind MySQL to localhost or to a dedicated database interface, and block port 3306 at the network edge. Remove anonymous and empty-password accounts, grant each application only the privileges and host sources it needs, and use TLS for remote connections. Set `secure_file_priv` to a restricted directory, keep `skip-name-resolve` in place where host-based rules are not required, and protect the configuration file with restrictive permissions.
