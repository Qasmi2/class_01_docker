# Proxmox Ubuntu 24.04 Cloud-Init Infrastructure with Terraform

This project deploys four Ubuntu 24.04 LTS virtual machines on a Proxmox VE node using Terraform and Cloud-Init.

It creates:

| VM name       | VMID | vCPU | RAM   | IP address        |
|---------------|-----:|-----:|------:|-------------------|
| devops-mgmt   | 101  | 2    | 4 GB  | 192.168.10.225/24 |
| k8s-master    | 102  | 2    | 4 GB  | 192.168.10.226/24 |
| k8s-worker1   | 103  | 2    | 4 GB  | 192.168.10.227/24 |
| k8s-worker2   | 104  | 2    | 4 GB  | 192.168.10.228/24 |

All VMs are cloned from the Proxmox template `ubuntu-2404-template`.

---

## Architecture

```text
Proxmox VE node: pve-02
├── VM 101  devops-mgmt
├── VM 102  k8s-master
├── VM 103  k8s-worker1
├── VM 104  k8s-worker2
└── VM 9000 ubuntu-2404-template
```

Each VM has:

- Ubuntu 24.04 LTS
- 2 vCPU cores
- 4 GB RAM
- 40 GB SCSI disk on `nvme-zfs`
- VirtIO network interface on `vmbr0`
- Static IP address
- Cloud-Init configuration
- QEMU Guest Agent enabled
- Serial console enabled

---

## Requirements

- Proxmox VE 9 or newer
- Terraform 1.6.0 or newer
- An Ubuntu 24.04 Cloud-Init template named `ubuntu-2404-template`
- Proxmox storage pools:
  - `nvme-zfs` for VM disks
  - `local-lvm` for Cloud-Init drives
- Proxmox bridge `vmbr0`
- SSH key pair on your workstation
- A dedicated Proxmox user for Terraform

---

## Project structure

```text
proxmox-gitops-infra/
├── provider.tf
├── main.tf
├── variables.tf
├── .gitignore
└── README.md
```

---

## 1. Create the Proxmox Terraform user

Run the following commands on the Proxmox host as `root`.

Create the Terraform role:

```bash
pveum role add TerraformProv -privs "Datastore.AllocateSpace Datastore.AllocateTemplate Datastore.Audit Pool.Allocate Pool.Audit Sys.Audit Sys.Console Sys.Modify VM.Allocate VM.Audit VM.Clone VM.Config.CDROM VM.Config.Cloudinit VM.Config.CPU VM.Config.Disk VM.Config.HWType VM.Config.Memory VM.Config.Network VM.Config.Options VM.Migrate VM.PowerMgmt SDN.Use VM.GuestAgent.Audit VM.GuestAgent.Unrestricted"
```

Create the Terraform user:

```bash
pveum user add terraform-prov@pve --password 'StrongPasswordHere'
```

Assign the role to the user:

```bash
pveum acl modify / --users terraform-prov@pve --roles TerraformProv
```

Verify permissions:

```bash
pveum user permissions terraform-prov@pve
```

The user must have, at minimum:

- `VM.Clone`
- `VM.Allocate`
- `VM.Config.*`
- `VM.GuestAgent.Audit`
- `VM.GuestAgent.Unrestricted`
- `Datastore.AllocateSpace`
- `Datastore.Audit`

Do not add `VM.Monitor`; it was removed in Proxmox VE 9.

---

## 2. Create the Ubuntu Cloud-Init template

Download the Ubuntu 24.04 QCow2 cloud image:

```bash
mkdir -p /var/lib/vz/template/iso
cd /var/lib/vz/template/iso

wget -O ubuntu-24.04-cloudimg.qcow2 \
  [https://cloud-images.ubuntu.com/noble/current/noble-server-cloudimg-amd64.img](https://cloud-images.ubuntu.com/noble/current/noble-server-cloudimg-amd64.img)
```

The correct image for Proxmox/KVM is:

```text
noble-server-cloudimg-amd64.img
```

It is a QCow2 bootable disk image intended for virtual machines. [Ubuntu Cloud Images](https://cloud-images.ubuntu.com/noble/current/)

Create the template:

```bash
qm create 9000 \
  --name ubuntu-2404-template \
  --memory 2048 \
  --cores 2 \
  --net0 virtio,bridge=vmbr0

qm importdisk 9000 /var/lib/vz/template/iso/ubuntu-24.04-cloudimg.qcow2 local-lvm

qm set 9000 \
  --scsihw virtio-scsi-pci \
  --scsi0 local-lvm:vm-9000-disk-0

qm set 9000 --ide2 local-lvm:cloudinit

qm set 9000 --boot order=scsi0

qm set 9000 --serial0 socket --vga serial0

qm set 9000 --agent enabled=1

qm resize 9000 scsi0 40G

qm template 9000
```

Verify the template:

```bash
qm config 9000
```

Confirm that it contains:

```text
scsi0: ...
ide2: local-lvm:vm-9000-cloudinit,media=cdrom
serial0: socket
vga: serial0
agent: enabled=1
```

---

## 3. Terraform provider configuration

`provider.tf`:

```hcl
terraform {
  required_version = ">= 1.6.0"

  required_providers {
    proxmox = {
      source  = "Telmate/proxmox"
      version = "3.0.2-rc04"
    }
  }
}

provider "proxmox" {
  pm_api_url      = "[https://192.168.10.214:8006/api2/json](https://192.168.10.214:8006/api2/json)"
  pm_user         = "terraform-prov@pve"
  pm_password     = var.pm_password
  pm_tls_insecure = true
}
```

Use Telmate provider version `3.0.2-rc04` or newer with Proxmox VE 9. Older versions require the removed `VM.Monitor` privilege and fail during `terraform plan`.

---

## 4. Terraform variables

`variables.tf`:

```hcl
variable "pm_password" {
  description = "Proxmox API password for terraform-prov@pve"
  type        = string
  sensitive   = true
}

variable "ciuser_password" {
  description = "Password for the devops user inside the VMs"
  type        = string
  sensitive   = true
}

variable "ssh_public_key" {
  description = "Public SSH key injected into the VMs by Cloud-Init"
  type        = string
}

variable "infrastructure_vms" {
  description = "Definitions of the Proxmox VMs to create"

  type = map(object({
    vmid   = number
    cores  = number
    memory = number
    ip     = string
  }))

  default = {
    "devops-mgmt" = {
      vmid   = 101
      cores  = 2
      memory = 4096
      ip     = "192.168.10.225/24"
    }

    "k8s-master" = {
      vmid   = 102
      cores  = 2
      memory = 4096
      ip     = "192.168.10.226/24"
    }

    "k8s-worker1" = {
      vmid   = 103
      cores  = 2
      memory = 4096
      ip     = "192.168.10.227/24"
    }

    "k8s-worker2" = {
      vmid   = 104
      cores  = 2
      memory = 4096
      ip     = "192.168.10.228/24"
    }
  }
}
```

---

## 5. Terraform VM resource

`main.tf`:

```hcl
resource "proxmox_vm_qemu" "kubernetes_cluster" {
  for_each    = var.infrastructure_vms
  name        = each.key
  vmid        = each.value.vmid
  target_node = "pve-02"

  clone = "ubuntu-2404-template"

  cores   = each.value.cores
  sockets = 1
  memory  = each.value.memory

  scsihw        = "virtio-scsi-pci"
  agent         = 1
  agent_timeout = 300

  os_type    = "cloud-init"
  ciuser     = "devops"
  cipassword = var.ciuser_password
  sshkeys    = var.ssh_public_key

  ipconfig0 = "ip=${each.value.ip},gw=192.168.10.1"

  disk {
    slot    = "scsi0"
    type    = "disk"
    size    = "40G"
    storage = "nvme-zfs"
  }

  disk {
    slot    = "ide2"
    type    = "cloudinit"
    storage = "local-lvm"
  }

  network {
    id     = 0
    model  = "virtio"
    bridge = "vmbr0"
  }

  serial {
    id   = 0
    type = "socket"
  }

  vga {
    type = "serial0"
  }
}
```

### Important Cloud-Init settings

- `os_type = "cloud-init"` enables Cloud-Init support.
- `ciuser = "devops"` creates the `devops` user.
- `cipassword` sets that user’s password.
- `sshkeys` injects the public SSH key.
- `ipconfig0` assigns the static IP and gateway.
- The `ide2` Cloud-Init disk is required. Without it, Proxmox cannot deliver the Cloud-Init configuration to the VM.

---

## 6. Deploy the infrastructure

Initialize Terraform:

```bash
terraform init -upgrade
```

Export the required secrets:

```bash
export TF_VAR_pm_password='YourProxmoxPassword'
export TF_VAR_ciuser_password='YourVmPassword'
export TF_VAR_ssh_public_key="$(cat ~/.ssh/id_ed25519.pub)"
```

Preview the deployment:

```bash
terraform plan
```

Apply it:

```bash
terraform apply
```

Confirm with:

```text
yes
```

For an exact reviewed plan:

```bash
terraform plan -out=tfplan
terraform apply tfplan
```

---

## 7. Verify the deployment

List the VMs:

```bash
qm list
```

Expected output:

```text
VMID NAME                 STATUS     MEM(MB) BOOTDISK(GB)
101  devops-mgmt          running    4096    40.00
102  k8s-master           running    4096    40.00
103  k8s-worker1          running    4096    40.00
104  k8s-worker2          running    4096    40.00
9000 ubuntu-2404-template stopped    2048    40.00
```

Check a VM configuration:

```bash
qm config 101
```

Confirm these settings exist:

```text
agent: enabled=1
ide2: local-lvm:vm-101-cloudinit,media=cdrom
serial0: socket
vga: serial0
ipconfig0: ip=192.168.10.225/24,gw=192.168.10.1
ciuser: devops
sshkeys: ssh-ed25519 ...
```

Test the QEMU Guest Agent:

```bash
qm agent 101 ping
qm agent 102 ping
qm agent 103 ping
qm agent 104 ping
```

---

## 8. Connect to the VMs

SSH into the VMs:

```bash
ssh devops@192.168.10.225
ssh devops@192.168.10.226
ssh devops@192.168.10.227
ssh devops@192.168.10.228
```

Use the private key that matches the public key supplied to Terraform.

You can also use the Proxmox serial console:

```bash
qm terminal 101
qm terminal 102
qm terminal 103
qm terminal 104
```

Press `Enter` after connecting to see the login prompt.

Disconnect with:

```text
Ctrl+O
```

The letter is `O`, not zero.

---

## 9. Install the QEMU Guest Agent

The QEMU Guest Agent must be installed inside each Ubuntu VM.

SSH into a VM and run:

```bash
sudo apt update
sudo apt install -y qemu-guest-agent
sudo systemctl enable --now qemu-guest-agent
systemctl status qemu-guest-agent
```

The service should show:

```text
Active: active (running)
```

To install it automatically in future VMs, add this to the Ubuntu template’s Cloud-Init user-data:

```yaml
packages:
  - qemu-guest-agent

runcmd:
  - systemctl enable --now qemu-guest-agent
```

---

## 10. Common issues and fixes

### `VM.Monitor` permission error

Proxmox VE 9 removed the `VM.Monitor` privilege.

Do not run:

```bash
pveum role add ... VM.Monitor
```

Use Telmate provider `3.0.2-rc04` or newer:

```hcl
version = "3.0.2-rc04"
```

Then run:

```bash
terraform init -upgrade
```

### `No CloudInit Drive found`

The VM is missing its Cloud-Init CD-ROM drive.

Attach it manually:

```bash
qm set <VMID> --ide2 local-lvm:cloudinit
qm cloudinit update <VMID>
qm stop <VMID>
qm start <VMID>
```

Or ensure Terraform contains:

```hcl
disk {
  slot    = "ide2"
  type    = "cloudinit"
  storage = "local-lvm"
}
```

### `QEMU guest agent is not running`

The agent is enabled in Proxmox but not installed or running inside the guest.

Install it inside the VM:

```bash
sudo apt update
sudo apt install -y qemu-guest-agent
sudo systemctl enable --now qemu-guest-agent
```

### VM stays in `Still creating...`

Terraform may be waiting for the QEMU Guest Agent to report an IP address.

Install and start the guest agent inside the VM, or increase the timeout:

```hcl
agent_timeout = 300
```

### Deprecated `cores` and `memory` warnings

Replace:

```hcl
cores   = each.value.cores
sockets = 1
memory  = each.value.memory
```

With:

```hcl
cpu {
  cores   = each.value.cores
  sockets = 1
}

memory {
  dedicated = each.value.memory
}
```

---

## 11. Destroy the infrastructure

To delete only the four Terraform-managed VMs and keep the Ubuntu template:

```bash
terraform destroy
```

Confirm with:

```text
yes
```

To delete the VMs and template manually:

```bash
for id in 101 102 103 104 9000; do
  qm stop $id 2>/dev/null || true
  qm destroy $id --purge
done
```

`qm destroy <VMID>` deletes a VM. The `--purge` option also removes it from replication, backup, and HA-related configurations. [Proxmox documentation](https://pve.proxmox.com/pve-docs/pve-admin-guide.html)

---

## 12. Security recommendations

- Never commit passwords, private SSH keys, `.tfvars` files, or Terraform state files.
- Use environment variables for sensitive values.
- Use a dedicated `terraform-prov@pve` user instead of `root@pam`.
- For production, use a Proxmox API token instead of a password.
- Protect `terraform.tfstate` because it can contain sensitive values.

`.gitignore`:

```text
.terraform/
*.tfstate
*.tfstate.*
crash.log
*.log
terraform.tfvars
*.tfvars
override.tf
override.tf.json
*_override.tf
*_override.tf.json
.terraform.lock.hcl
```