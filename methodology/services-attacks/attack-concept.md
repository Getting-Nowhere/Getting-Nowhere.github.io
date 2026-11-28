---
layout: page
title: "Attack Concept"
subtitle: "The source, process, privileges and destination model used to analyse any service attack"
permalink: /methodology/services-attacks/attack-concept/
---

Every attack on a service follows the same pattern: an input from a source is handled by a process, under certain privileges, and the result reaches a destination. Describing an attack in these four categories helps find the weak link, decide what to test next and explain the flaw in a report. This page defines the categories and shows how a real vulnerability maps onto them.

## The four categories

| Category | Question it answers | Examples |
|----------|---------------------|----------|
| Source | Where does the data come from? | Code, libraries, configuration, APIs, user input |
| Process | How is the data handled? | Process ID, input handling, data processing, variables, logging |
| Privileges | Under which rights does the process run? | SYSTEM or root, user accounts, groups, policies, application rules |
| Destination | Where does the result go? | Local file system or database, or a remote network address |

Sources include the code already executed, the libraries it loads, static configuration, the APIs it calls and values typed by a user. A process is defined by its PID, the input it accepts, the functions that transform it, the variables that hold it and the logs that record it. Privileges range from full system rights to narrow per-user or per-application rules. A destination can be local, such as a written file, or networked, such as an outbound connection.

## Working method

1. Identify the service and list its inputs (sources).
2. Trace how each input is processed and which checks apply.
3. Determine the privilege level the process runs with.
4. Identify where the output lands, locally or over the network.
5. Look for a point where a source can influence a process running with higher privilege or a more useful destination.

## Worked example: Log4j

The Log4j vulnerability shows how the categories chain together.

| Step | Description | Category |
|------|-------------|----------|
| 1 | The attacker places a JNDI lookup string in a request header such as the user agent. | Source |
| 2 | The logging process interprets the header and performs the lookup. | Process |
| 3 | Logging runs with high privileges, so the lookup executes with them. | Privileges |
| 4 | The lookup points at an attacker server, which is the destination. | Destination |
| 5 | The attacker server returns a malicious class, which becomes a new source. | Source |
| 6 | The process loads and reads that class. | Process |
| 7 | The class runs with the same elevated privileges. | Privileges |
| 8 | Commands return over the network to the attacker, the final destination. | Destination |

## Worked example: FTP path traversal

A path traversal in an FTP service also follows the model. The user supplies a request type, a file name and file contents as a source. The service processes the request, its authorization checks only cover one folder, and the traversal breaks out of it. The privileges of the service then write the attacker's content to a location the user should not reach. The destination is a local file.

> The categories are a reasoning aid, not a checklist. Use them to decide where to look next: an input that reaches a privileged process or a sensitive destination is the high-value path.
{: .tip }

## Relevance to services

- SMB: user-supplied share paths and credentials are sources. Administrative rights decide whether remote execution succeeds.
- Databases: SQL statements are sources, and the service account's privileges decide the destination for file or command output.
- Mail and DNS: SMTP commands and DNS queries are sources, and the destination is either another mail system or a client.

## What to look for

- Inputs that reach a process with higher privileges than the user.
- Logging or parsing functions that act on user-controlled values.
- Destinations that can be changed through an input, such as file paths or remote hosts.

## Pitfalls

- Stopping at the first working source. Confirm the privilege level of the process before reporting impact.
- Treating the model as a substitute for testing. Each category must be verified against the live service.

## Prevention

Validate and encode every input, run services with the lowest privilege that works, restrict where processes can write or connect, and log their actions. See the [services prevention](/methodology/services-attacks/prevention/) page.
