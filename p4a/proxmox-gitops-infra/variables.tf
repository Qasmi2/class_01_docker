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