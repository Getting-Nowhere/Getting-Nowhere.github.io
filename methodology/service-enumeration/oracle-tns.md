---
layout: page
title: "Oracle TNS Listener"
subtitle: "Listener discovery, SID identification and database account checks on port 1521"
permalink: /methodology/service-enumeration/oracle-tns/
---

## Purpose

Oracle Transparent Network Substrate (TNS) carries traffic between client applications and Oracle database instances over TCP/IP and other transports. The TNS listener accepts incoming connections and routes them to the correct instance. Its banner, its SID or service names and its database accounts all provide enumeration value. This page covers how to fingerprint the listener, identify database instances, test accounts and read the configuration files that define connections.

## Background

- The default port is TCP 1521.
- The client resolves a service name through `tnsnames.ora`, which holds one entry per database with its address, port and service name.
- The server-side `listener.ora` defines which addresses and instances the listener serves. Both files are normally found in `$ORACLE_HOME/network/admin`.
- A System Identifier (SID) identifies one database instance, which is a set of processes and memory structures. Newer connection strings often use a service name instead.

## Enumeration steps

### 1. Fingerprint the listener and brute-force SIDs

```bash
sudo nmap -p1521 -sV TARGET_IP --open --script oracle-sid-brute
```

The listener often reports its version even when it refuses unauthenticated commands. A result such as "unauthorized" in the version string still confirms the service and its release.

### 2. Run ODAT

```bash
./odat all -s TARGET_IP
```

ODAT (Oracle Database Attacking Tool) combines SID discovery, account testing and other checks. Read its output carefully, since many of its checks send credential guesses.

### 3. Review TNS configuration (with host access)

Check `tnsnames.ora` and `listener.ora` under `$ORACLE_HOME/network/admin`. Look for the host, port, service name, the `SERVER` mode (dedicated or shared) and any `USER` or `PASSWORD` values stored in the file.

### 4. Log in with SQL*Plus

```bash
sqlplus USERNAME/PASSWORD@TARGET_IP/SID
sqlplus USERNAME/PASSWORD@TARGET_IP/SID as sysdba
```

Use the SID form shown above when the instance is known. Use the service name in its place when `tnsnames.ora` or the listener refers to a service. If SQL*Plus reports a missing library, the Oracle client libraries are not on the loader path. Add the library directory and refresh the cache:

```bash
sudo sh -c "echo LIB_PATH > /etc/ld.so.conf.d/oracle-instantclient.conf"
sudo ldconfig
```

### 5. Query accounts and hashes (only with sufficient privilege)

```sql
select name, password from sys.user$;
```

This query requires DBA-level privileges. The returned hashes are sensitive, so handle them according to the scope.

## What to look for

- Listener versions with known weaknesses, confirmed against the vendor advisory for the release.
- Valid SIDs or service names, which narrow the next step.
- Default or sample accounts still present, and legacy accounts such as DBSNMP that may retain default passwords. Check the vendor documentation for the version in scope.
- Accounts that can log in as SYSDBA or SYSOPER, which carry broad rights.
- Configuration files that store credentials in plain text.

> Oracle listeners that accept connections without any listener password or access restriction expose every service they route. Document which SIDs and services answer, since each one is a separate target.
{: .tip }

## Pitfalls

- **SID versus service name.** Connection strings differ between the two. A failed connection may mean the wrong identifier was used rather than bad credentials.
- **Account lockouts** can be triggered by repeated attempts across many accounts. Test a short, agreed list only.
- **Client setup.** SQL*Plus issues are usually environment problems, not authentication results. Confirm the client connects before concluding that the credentials are wrong.
- **Version claims.** Older releases shipped with default passwords on several accounts, but the defaults differ by release. Confirm them for the exact version in scope.
- **Scanner output.** The SID brute-force script reports only the SIDs it guessed. A missing SID does not prove the instance is absent.

## Defense and prevention

Restrict access to port 1521 with network controls so that only application servers reach the listener. Set a listener password or use valid-node checking where the release supports it, change or lock all default and sample accounts (including DBSNMP), and remove sample schemas from production. Apply vendor patches promptly, minimise the number of accounts with SYSDBA rights, and keep `tnsnames.ora` and `listener.ora` readable only by the service owner.
