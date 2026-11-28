---
layout: page
title: "SQL Injection"
subtitle: "Confirming injectable parameters, fingerprinting the DBMS and classifying the injection"
permalink: /methodology/web-app/sql-injection/
---

SQL injection occurs when user input is concatenated into a database query, so that the input changes the logic of the query instead of acting as data. This phase confirms the injection by hand, identifies the database, and selects the technique that fits what the application returns. Enumeration and extraction are covered on the [UNION injection](/methodology/web-app/union-injection/) and [SQLMap](/methodology/web-app/sqlmap/) pages.

## How the injection works

The application builds its query from the input, for example:

```sql
select * from logins where username like '%INPUT'
```

A single quote closes the string literal early, and whatever follows it is parsed as SQL. The injected query must remain syntactically valid. If it does not, the database returns an error, which confirms that the input reaches the query but gives no data.

## Workflow

1. Probe for syntax errors. Submit each character below and watch for a database error, a changed response or a changed status code. In a GET parameter, send the URL-encoded form:

| Payload | URL encoded |
|---|---|
| `'` | `%27` |
| `"` | `%22` |
| `#` | `%23` |
| `;` | `%3B` |
| `)` | `%29` |

2. Repair the syntax so that the query still parses. Use an even number of quotes, or comment out the remainder of the original query. A classic logic test is:

```sql
admin' or '1'='1
```

The resulting query becomes:

```sql
SELECT * FROM logins WHERE username='admin' or '1'='1' AND password = 'something';
```

`AND` is evaluated before `OR`, so the expression is true whenever the username `admin` exists. The password check is skipped.

3. Comment out the rest of the query. In MySQL, comments start with `-- ` (dash, dash, space), `#` or `/* */`. Use `-- -` so the trailing space is not lost in transit. In a browser, a bare `#` is treated as a fragment, so send `%23`.

```sql
admin'-- -
```

```sql
SELECT * FROM logins WHERE username='admin'-- ' AND password = 'something';
```

If the password is hashed before it reaches the query, injecting through the password field fails. Move the payload to the username field. For parenthesised conditions, `admin')-- -` closes the parenthesis first.

4. Fingerprint the DBMS. Use functions whose results differ between database engines:

| Payload | Use when | MySQL result | Other engines |
|---|---|---|---|
| `SELECT @@version` | Full query output is shown | Version string | Returns a different version string on MSSQL; error elsewhere |
| `SELECT POW(1,1)` | Only numeric output is shown | `1` | Error on other engines |
| `SELECT SLEEP(5)` | No output is shown | Response delayed 5 seconds, returns `0` | No delay on other engines |

5. Classify the injection by what the application returns:

| Type | Signal | Next step |
|---|---|---|
| Union based | Query results are rendered on the page | UNION injection, the fastest route |
| Error based | Database errors are shown | Extract data through error messages |
| Boolean based blind | The page differs between true and false conditions | Infer data one character at a time |
| Time based blind | A conditional `SLEEP()` delays the response | Infer data from response delays |
| Out of band | Neither output nor timing is usable | Make the database send data to a server the tester controls, usually over DNS |

Stacked queries, where a second statement follows a `;`, work on MSSQL and PostgreSQL but not on MySQL.

## What to look for

- Any change in the response caused by a quote that a clean request does not contain.
- Query columns rendered on the page. These point to UNION injection.
- Error text that names the DBMS or the query syntax.
- Consistent response delays after `SLEEP()`, which point to time based techniques.
- A value that never changes the response. The parameter may not be processed by the query at all.

## Pitfalls

- A payload that parses in one DBMS can fail in another. Fingerprint before building the query.
- An unencoded `#` or `&` truncates the payload in a URL. Encode it.
- Hashed fields, hidden tokens and client-side checks can block a payload without showing that the application is safe.
- Time based results on a slow server are unreliable. Repeat the test before recording the finding.

> Defense: parameterised queries keep input out of the query text, which removes the injection at its source. Escaping special characters is a weaker fallback. See [Prevention and remediation](/methodology/web-app/prevention/).
{: .info }
