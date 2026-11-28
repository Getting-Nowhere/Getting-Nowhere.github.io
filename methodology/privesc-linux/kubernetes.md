---
layout: page
title: "Kubernetes"
subtitle: "Reaching the Kubelet API, service account tokens and RBAC rights to escape to a node"
permalink: /methodology/privesc-linux/kubernetes/
---

Kubernetes runs containers in pods, scheduled across worker nodes and managed by a control plane. Several components expose network interfaces and credentials, and a misconfiguration in any of them can move an attacker from a container to the node, and from the node to the cluster. This page covers the main components, how to check each, and where a path to the host starts.

## Workflow

1. Identify the component you can reach, starting with the Kubelet and the API server.
2. Check whether anonymous or unauthenticated access is allowed.
3. Enumerate pods, namespaces and running containers.
4. Retrieve the service account token and CA certificate from a container you can reach.
5. Ask the API server what the token is allowed to do (`auth can-i --list`).
6. Only if the rights permit, create or modify a workload, and clean up afterwards.

## Components and default ports

| Component | Port | Note |
|---|---|---|
| etcd | 2379, 2380 | Cluster state store; must not be reachable from workers or users |
| API server | 6443 | Entry point for all administrative requests |
| Scheduler | 10251 | Places pods on nodes |
| Controller manager | 10252 | Runs the controllers |
| Kubelet API | 10250 | Node agent; authenticated and authorised access expected |
| Read-only Kubelet API | 10255 | Unauthenticated read of pod information where enabled |

Scan the target for these ports within scope (see [Enumeration](/methodology/privesc-linux/enumeration/) for host-level checks).

## Step 1: Check the API server

```bash
curl -sk https://TARGET_IP:6443
```

A `403 Forbidden` response that names `system:anonymous` shows the server is reachable and that anonymous requests are denied. This is the expected configuration. A successful response without credentials is a critical finding.

## Step 2: Check the Kubelet API

```bash
curl -sk https://TARGET_IP:10250/pods | jq .
```

The Kubelet returns pod names, namespaces, creation times and container images. The last-applied configuration can contain environment variables, secrets or image pull settings, which are sensitive. Kubelet tools such as `kubeletctl` automate the same requests and can list the containers on a node.

Decision point: if the Kubelet accepts unauthenticated requests, the attacker can run commands in the containers it manages. This is a direct path to a service account token.

## Step 3: Retrieve the service account token

Each pod normally mounts its service account credentials at a fixed path:

```text
/var/run/secrets/kubernetes.io/serviceaccount/token
/var/run/secrets/kubernetes.io/serviceaccount/ca.crt
```

If command execution in a pod is available, read both files and store them in a restricted scratch directory. Do not paste the token into reports.

## Step 4: Check what the token can do

```bash
kubectl --token=TOKEN --certificate-authority=ca.crt --server=https://TARGET_IP:6443 auth can-i --list
```

The output lists the resources and verbs the token holds. Look for:

- `create` or `patch` on `pods`, which allows a new workload to be scheduled with host access.
- `get` or `list` on `secrets`, which exposes credentials from other workloads.
- `get` on `nodes/proxy`, which can open a route to the Kubelet.
- `exec` on `pods`, which runs commands in running containers.

## Step 5: Host access through a workload

A pod that mounts the host filesystem with `hostPath`, and runs in the host network, reaches the node's files. The relevant fields of a pod manifest are shown below with placeholders:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: POD_NAME
  namespace: NAMESPACE
spec:
  hostNetwork: true
  automountServiceAccountToken: true
  containers:
  - name: CONTAINER_NAME
    image: IMAGE_NAME
    volumeMounts:
    - name: host-root
      mountPath: /host
  volumes:
  - name: host-root
    hostPath:
      path: /
```

Creating such a pod requires `create` on pods and is an obvious policy violation in most clusters. Confirm the pod reaches `Running`, read the file that proves access (for example a host SSH key), then delete the pod.

## What to look for

- An anonymous API or Kubelet response that returns pod data.
- Service account tokens with broader rights than the workload needs.
- `hostPath`, `hostNetwork`, `hostPID` or privileged containers in pod specs.
- Secrets in environment variables, container arguments or last-applied annotations.

## Pitfalls

- A token that is valid for the API may still be limited by namespace. Run `auth can-i` in each namespace of interest.
- The Kubelet may be read-only on one port and authenticated on another. Test each port separately.
- Creating resources changes the cluster. Record every object created and remove it at the end.
- Container images in the output can be out of date, which is itself a risk. Record the image tags rather than assuming the latest.

## Defense

- Disable anonymous authentication on the Kubelet and the API server. Use webhook authorisation for the Kubelet.
- Enforce least privilege with RBAC. Avoid default service account bindings, and set `automountServiceAccountToken: false` where pods do not call the API.
- Apply Pod Security Standards or admission policies to block `hostPath`, `hostNetwork`, `hostPID` and privileged containers.
- Keep etcd and the control plane off the worker network and restrict ports 10250 and 10255.
- Rotate tokens and certificates when exposure is suspected. See [Prevention and hardening](/methodology/privesc-linux/prevention/).
