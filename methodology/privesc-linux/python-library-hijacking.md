---
layout: page
title: "Python Library Hijacking"
subtitle: "Replacing or shadowing Python modules that privileged scripts import"
permalink: /methodology/privesc-linux/python-library-hijacking/
---

A Python script imports modules by name, and Python searches a list of directories in order. If a privileged script imports a module that the current user can modify, or that is shadowed by a module in a writable directory earlier in the search order, the attacker's code runs with the script's privileges. This page covers the three common forms of the problem: writable module files, writable directories in the search path, and the `PYTHONPATH` variable exposed through sudo.

## Workflow

1. Identify privileged Python scripts (SUID, sudo-permitted or run by root from cron) and read their imports.
2. Locate each imported module on disk.
3. Check write permissions on the module file and its directory.
4. Inspect Python's module search path for the interpreter in use.
5. Check sudo rules for `SETENV` on the interpreter.

## Step 1: Read the script and its imports

```bash
ls -l /path/to/script.py
cat /path/to/script.py
```

The `ls -l` output shows owner, group and mode. A script that is SUID or run by root and imports a non-standard module is a candidate. Record the module names.

## Step 2: Locate the module

```bash
python3 -c "import MODULE_NAME, os; print(os.path.abspath(MODULE_NAME.__file__))"
pip3 show MODULE_NAME
```

The second command reports the install location of the package. Read the module file that the script calls, and confirm the function name and arguments it uses.

## Step 3: Check the module file and directory

```bash
ls -l /usr/local/lib/python3.8/dist-packages/MODULE_NAME/__init__.py
ls -ld /usr/local/lib/python3.8/dist-packages/MODULE_NAME
```

A module file writable by the current user (or by a group they belong to) can be edited directly. This is the simplest case. Record the owner and mode, and do not edit the file on a live host unless the rules of engagement allow it. Take a backup of any file before changing it.

## Step 4: Check the module search path

```bash
python3 -c 'import sys; print("\n".join(sys.path))'
```

Typical output lists the standard library, the `site-packages` or `dist-packages` directories, and the current directory for scripts run from it. Python uses the first match in this list. A directory earlier in the list that is writable by the current user, and that contains a module with the same name as one the script imports, takes precedence over the real module.

Check each directory in the list:

```bash
for d in $(python3 -c 'import sys; print(" ".join(sys.path))'); do ls -ld "$d" 2>/dev/null; done
```

The module shadowing must keep the same name and provide the same function signature. Otherwise the script fails on import or call.

## Step 5: Check PYTHONPATH through sudo

`PYTHONPATH` adds directories to the front of the search path. If a sudo rule grants `SETENV` for the interpreter, the user may set the variable for that run:

```bash
sudo -l
```

Look for `SETENV:` against `/usr/bin/python3` or another interpreter. If present, a module in a directory the user controls will be imported ahead of the system module when the script is run. This is a sudo-policy issue as well as a library issue.

## What to look for

- A module file under a system `site-packages` or `dist-packages` directory that is writable by non-administrators.
- A writable directory high in `sys.path` that shadows a module the script imports.
- `SETENV` on an interpreter in sudo rules.
- Privileged scripts that import a module from the current directory or from a user-writable path.

## Pitfalls

- Python caches compiled bytecode in `__pycache__`. A changed source file may not take effect until the cache is refreshed. Check file timestamps and the cache directory.
- The Python version and install path must match the script's interpreter. Confirm with `which python3` and `python3 --version`.
- A shadowing module that does not match the original's signature will break the script. Test on a copy first where possible.
- Remove any shadowing module after testing, and clear the bytecode cache for the affected module.

## Defense

- Install Python packages as root in directories that are not writable by other users. Check with `ls -ld` on `site-packages` and `dist-packages`.
- Use virtual environments owned by the service account, not shared system paths.
- Do not grant `SETENV` on interpreters. Do not keep `PYTHONPATH` through sudo.
- Use absolute paths and explicit `sys.path` entries in privileged scripts. Avoid importing from the current directory.
- Check module permissions during each configuration audit. See [Shared object hijacking](/methodology/privesc-linux/shared-object-hijacking/) and [Prevention and hardening](/methodology/privesc-linux/prevention/).
