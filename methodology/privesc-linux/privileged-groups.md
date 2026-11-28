---
layout: page
title: "Privileged Groups"
subtitle: "Group memberships that give root-equivalent access without a root password"
permalink: /methodology/privesc-linux/privileged-groups/
---

Some Linux groups grant access that is equivalent to root, even though the group does not contain the word "root". Membership is often granted for convenience (to run containers, to read logs, to manage disks) and is easy to overlook in audits. This page lists the groups that matter, the check for each, and the decision point for whether the path is usable.

## Workflow

1. Read the current account's groups.
2. Read the membership of every privileged group on the host.
3. For each group the account belongs to, confirm the service behind it is installed and usable.
4. Use the least intrusive confirmation that shows the access.

## Step 1: Identify group membership

```bash
id
groups
cat /etc/group
getent group docker lxd lxc disk adm sudo shadow
```

`getent group NAME` is preferred over reading `/etc/group` directly, because it also covers directory-backed accounts.

## Step 2: Group reference

| Group | Effective access | Decision point |
|---|---|---|
| `docker` | Start a container with the host filesystem mounted | Docker daemon present and socket accessible |
| `lxd` or `lxc` | Create a privileged system container with the host filesystem mounted | LXD initialised and an image available |
| `disk` | Read and write raw block devices such as `/dev/sda1` | Device nodes in `/dev` accessible to the group |
| `adm` | Read the system logs in `/var/log` | Logs contain credentials, commands or cron activity |
| `sudo` or `wheel` | Use sudo according to the sudoers policy | See [sudo rights abuse](/methodology/privesc-linux/sudo-rights-abuse/) |
| `shadow` | Read `/etc/shadow` | Offline hash cracking |

Docker membership is covered in [Docker escape](/methodology/privesc-linux/docker-escape/).

## Step 3: LXD and LXC

Membership of the `lxd` group allows a container to be created and run with its security isolation disabled. The host root filesystem can then be mounted into that container.

Decision points:

- Is LXD initialised (`lxd init` has been run, or a storage pool and network exist)?
- Is an image available locally, or can one be imported from an approved source?
- Does the container's privileged setting and its disk device make the host filesystem reachable?

A generic sequence, with names replaced by placeholders:

```bash
lxc image list
lxc init IMAGE_ALIAS CONTAINER_NAME -c security.privileged=true
lxc config device add CONTAINER_NAME host-root disk source=/ path=/mnt/root recursive=true
lxc start CONTAINER_NAME
lxc exec CONTAINER_NAME /bin/sh
```

Inside the container, `/mnt/root` is the host root filesystem. Reading `/mnt/root/etc/shadow` or `/mnt/root/root/.ssh` is the usual proof of access. Delete the container and device when finished, and record that a privileged container was created.

## Step 4: Disk group

Members of `disk` can read and write raw block devices. With a filesystem debugger or a raw-device reader, the filesystem can be read without normal permission checks.

```bash
ls -l /dev/sd* /dev/vd* 2>/dev/null
lsblk
```

Confirm that the group owns the device nodes before concluding the access exists. Writing to a live filesystem is destructive, so reads are the preferred proof.

## Step 5: ADM group

`adm` gives read access to `/var/log`. This is not direct root access, but logs often contain commands with passwords, cron output, backup paths and authentication events.

```bash
ls -la /var/log
grep -ri "password\|passwd\|token" /var/log 2>/dev/null | head
```

## What to look for

- Non-administrative accounts that belong to `docker`, `lxd`, `lxc` or `disk`.
- Groups that a service account was added to for a single task, and that the task no longer needs.
- Device nodes and log directories with group permissions wider than expected.

## Pitfalls

- Group membership takes effect at login. A user added to a group needs a new session (`newgrp` or logout and login) before `id` shows it.
- A group can exist without any usable service. Confirm the daemon or socket before reporting a path.
- Using a container or device to read host files may be logged. Record the time and the files accessed.

## Defense

- Keep `docker`, `lxd` and `disk` membership to administrators who need it, and treat the membership as equivalent to root.
- Restrict access to the Docker socket and LXD daemon through policy rather than group convenience.
- Review `/etc/group` as part of user management, and remove dormant memberships.
- Limit `/var/log` permissions to the logging service and administrators.
- See [Prevention and hardening](/methodology/privesc-linux/prevention/).
