---
layout: page
title: "Docker Escape"
subtitle: "Using Docker daemon access, group membership or a writable socket to reach host root"
permalink: /methodology/privesc-linux/docker-escape/
---

Docker runs containers that share the host kernel. The Docker daemon runs as root and accepts commands through a Unix socket, usually `/var/run/docker.sock`. Anyone who can talk to that daemon can start a container with the host filesystem mounted into it, which gives host root. This page covers the three ways that access usually appears, how to check each one, and how to report it.

## Workflow

1. Confirm whether the current shell is inside a container or on the host.
2. Check group membership, sudo rules and SUID status of the Docker client.
3. Locate the Docker socket and check its permissions.
4. List the images and running containers the account can see.
5. Confirm host access with a read-only file read through a mount.

## Step 1: Confirm the environment

```bash
id
hostname
cat /proc/1/cgroup 2>/dev/null
ls -la /var/run/docker.sock 2>/dev/null
```

A container usually has a different hostname and a restricted set of mounts. The socket is sometimes mounted into containers, which is itself a finding because it gives the container root on the host.

## Step 2: Check how the account can reach the daemon

Three conditions give access:

```bash
id                                    # is the user in the docker group?
sudo -l                               # is docker listed with NOPASSWD or as ALL?
find / -perm -4000 -name docker 2>/dev/null   # is the client SUID?
```

| Condition | Meaning |
|---|---|
| Member of the `docker` group | Can use the daemon without sudo; equivalent to root |
| `docker` in a sudo rule | Root through sudo; equivalent to root |
| SUID docker client | Runs with root rights for any user |

## Step 3: Check the socket

```bash
ls -l /var/run/docker.sock
docker -H unix:///var/run/docker.sock ps
docker -H unix:///var/run/docker.sock image ls
```

The socket is normally `root:docker` with mode `660`. If it is writable by the current user, through group membership or a permission error, the daemon is reachable even without the `docker` group.

If the `docker` client is not installed on the target, a copy may be uploaded from an approved source. Keep the binary separate from the target's system directories and remove it afterwards.

## Step 4: Use the daemon to reach the host filesystem

With daemon access, a container can be started with the host root directory mounted. A generic form, with the image name as a placeholder:

```bash
docker run --rm -it -v /:/mnt IMAGE_NAME chroot /mnt bash
```

Or, to read files without a shell:

```bash
docker run --rm -v /:/hostroot IMAGE_NAME cat /hostroot/etc/shadow
```

Inside the container the host root is at `/mnt` or `/hostroot`. The usual proof is reading a file the current account could not read before, such as `/root/.ssh/id_rsa`, and then recording the path and the fact that it was read.

## Step 5: Mounted host directories from inside a container

A container with a host directory mounted as a volume can read and write that directory with the permissions of the mapped user. Check for mounts from inside the container:

```bash
cat /proc/mounts
df -h
ls -la /hostsystem 2>/dev/null
```

Look for mounts of `/`, `/etc`, `/root`, `/home` or the Docker socket itself. A read-only mount prevents modification of the host but still allows reading secrets.

## What to look for

- The `docker` group in the output of `id` for a non-administrative account.
- A world-readable or group-readable Docker socket.
- Containers that run with `--privileged`, mount `/`, or mount the Docker socket.
- Images on the host that the account can start without authentication.

## Pitfalls

- A container without the socket cannot start new containers. Check mounts before assuming daemon access.
- Images may not be present locally. Use the images that are available (`docker image ls`) rather than pulling new ones on the target.
- Starting a container writes entries to the Docker event log. Record the container ID and remove it after use with `docker rm`.
- Some hardened hosts use rootless Docker or user namespaces, which limit the effect. Confirm the daemon's user before reporting host root.

## Defense

- Treat the `docker` group as root. Add users only when they are trusted with host root.
- Never mount `/var/run/docker.sock` into a container.
- Run the daemon in rootless mode where the workload supports it, and use user namespace remapping.
- Restrict container capabilities and avoid `--privileged`.
- Use an authorisation plugin or a remote, TLS-authenticated API rather than local socket access where the design allows.
- See [Privileged groups](/methodology/privesc-linux/privileged-groups/) and [Prevention and hardening](/methodology/privesc-linux/prevention/).
