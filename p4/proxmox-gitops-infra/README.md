# Proxmox Ubuntu Cloud-Init VMs with Terraform

This project uses Terraform to deploy four Ubuntu 24.04 VMs on a Proxmox VE node from an existing Ubuntu Cloud-Init template.

It creates:

| VM name       | VMID | vCPU | RAM   | IP address       |
|---------------|-----:|-----:|------:|------------------|
| devops-mgmt   | 101  | 2    | 4 GB  | 192.168.10.225/24 |
| k8s-master    | 102  | 2    | 4 GB  | 192.168.10.226/24 |
| k8s-worker1   | 103  | 2    | 4 GB  | 192.168.10.227/24 |
| k8s-worker2   | 104  | 2    | 4 GB  | 192.168.10.228/24 |

All VMs are cloned from the Proxmox template `ubuntu-2404-template`.

---

## Requirements

- Proxmox VE 9 or newer
- Terraform installed on your workstation
- An Ubuntu 24.04 Cloud-Init template already created in Proxmox
- A Proxmox user with permissions to clone templates and create VMs
- SSH key pair on your workstation
- Network bridge `vmbr0`
- Storage pools:
  - `nvme-zfs` for VM disks
  - `local-lvm` for Cloud-Init drives

---

## Project files

```text
proxmox-gitops-infra/
├── provider.tf
├── main.tf
├── variables.tf
├── terraform.tfvars   # optional, do not commit
└── .gitignore
```

---

## Provider configuration

`provider.tf`:

```hcl
terraform {
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

Important: use Telmate provider version `3.0.2-rc04` or newer with Proxmox VE 9. Older versions require the removed `VM.Monitor` privilege and fail with a permissions error.

---

## Variables

`variables.tf`:

```hcl
variable "pm_password" {
  description = "Proxmox API password"
  type        = string
  sensitive   = true
}

variable "ciuser_password" {
  description = "Password for the Cloud-Init user"
  type        = string
  sensitive   = true
  default     = null
}

variable "ssh_public_key" {
  description = "Public SSH key injected into the VMs by Cloud-Init"
  type        = string
  default     = "ssh-ed25519 AAAA... bpg@bpg-test"
}

variable "infrastructure_vms" {
  description = "VM definitions"
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

## VM resource

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

  os_type   = "cloud-init"
  ciuser    = "devops"
  sshkeys   = var.ssh_public_key
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

### Optional: enable VM console password login

SSH works using the injected public key. If you also want to log in through the Proxmox noVNC or serial console, add this inside the VM resource:

```hcl
cipassword = var.ciuser_password
```

Then export the password:

```bash
export TF_VAR_ciuser_password='YourVmPassword'
```

Without `cipassword`, the `devops` user can log in with SSH using the matching private key, but may not have a password for the Proxmox console.

---

## Create the Proxmox Terraform user

Run these commands on the Proxmox host as root.

Create a role:

```bash
pveum role add TerraformProv -privs "Datastore.AllocateSpace Datastore.AllocateTemplate Datastore.Audit Pool.Allocate Pool.Audit Sys.Audit Sys.Console Sys.Modify VM.Allocate VM.Audit VM.Clone VM.Config.CDROM VM.Config.Cloudinit VM.Config.CPU VM.Config.Disk VM.Config.HWType VM.Config.Memory VM.Config.Network VM.Config.Options VM.Migrate VM.PowerMgmt SDN.Use"
```

Create the Terraform user:

```bash
pveum user add terraform-prov@pve --password 'StrongPasswordHere'
```

Assign the role:

```bash
pveum acl modify / --users terraform-prov@pve --roles TerraformProv
```

Add QEMU Guest Agent permissions for Proxmox VE 9:

```bash
pveum role modify TerraformProv --append 1 \
  --privs "VM.GuestAgent.Audit VM.GuestAgent.Unrestricted"
```

Verify effective permissions:

```bash
pveum user permissions terraform-prov@pve
```

---

## Create the Ubuntu Cloud-Init template

Download the Ubuntu 24.04 QCow2 cloud image:

```bash
cd /var/lib/vz/template/iso

wget -O ubuntu-24.04-cloudimg.qcow2 \
  [https://cloud-images.ubuntu.com/noble/current/noble-server-cloudimg-amd64.img](https://cloud-images.ubuntu.com/noble/current/noble-server-cloudimg-amd64.img)
```

Create the template VM:

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

---

## Deploy the VMs

Initialize Terraform:

```bash
terraform init -upgrade
```

Export the Proxmox password:

```bash
export TF_VAR_pm_password='YourProxmoxPassword'
```

Optionally export the VM console password:

```bash
export TF_VAR_ciuser_password='YourVmPassword'
```

Preview the deployment:

```bash
terraform plan
```

Apply it:

```bash
terraform apply
```

To save and apply an exact reviewed plan:

```bash
terraform plan -out=tfplan
terraform apply tfplan
```

---

## Connect to the VMs

SSH into the created VMs:

```bash
ssh devops@192.168.10.225
ssh devops@192.168.10.226
ssh devops@192.168.10.227
ssh devops@192.168.10.228
```

Use the private SSH key that matches the public key in `variables.tf`.

---

## QEMU Guest Agent

The Terraform configuration enables the QEMU Guest Agent:

```hcl
agent = 1
```

The agent must also be installed inside each Ubuntu VM:

```bash
sudo apt update
sudo apt install -y qemu-guest-agent
sudo systemctl enable --now qemu-guest-agent
```

Verify from the Proxmox host:

```bash
qm agent 101 ping
qm agent 102 ping
qm agent 103 ping
qm agent 104 ping
```

To avoid installing it manually in future VMs, add this to the Ubuntu template’s Cloud-Init user-data:

```yaml
packages:
  - qemu-guest-agent

runcmd:
  - systemctl enable --now qemu-guest-agent
```

---

## Serial console access

Each VM has a serial console:

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

## Common issues and fixes

### `VM.Monitor` permission error

Proxmox VE 9 removed `VM.Monitor`. Do not add it to a role.

Use Telmate provider version `3.0.2-rc04` or newer:

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

### `Still creating...` for a long time

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

## Security recommendations

- Do not commit passwords, `.tfvars` files, Terraform state, or private SSH keys.
- Use environment variables for sensitive values.
- Use a dedicated `terraform-prov@pve` user instead of `root@pam`.
- Use an API token instead of a password for production.
- Keep `terraform.tfstate` private because it can contain sensitive values.

`.gitignore`:

```text
terraform.tfvars
*.tfvars
.terraform/
terraform.tfstate*
crash.log
*.log
```

---

## Destroy the infrastructure

To delete all VMs created by Terraform:

```bash
terraform destroy
```