variable "pm_password" {
  description = "Proxmox API password"
  type        = string
  sensitive   = true
}

variable "infrastructure_vms" {
  type = map(object({
    vmid   = number
    cores  = number
    memory = number
    ip     = string
  }))
  default = {
    "devops-mgmt" = { vmid = 101, cores = 2, memory = 4096, ip = "192.168.10.225/24" }
    "k8s-master"  = { vmid = 102, cores = 2, memory = 4096, ip = "192.168.10.226/24" }
    "k8s-worker1" = { vmid = 103, cores = 2, memory = 4096, ip = "192.168.10.227/24" }
    "k8s-worker2" = { vmid = 104, cores = 2, memory = 4096, ip = "192.168.10.228/24" }
  }
}

variable "ssh_public_key" {
  description = "Public SSH key injected into the VMs by Cloud-Init"
  type    = string
  default = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAINW8SnccwBUZd+TpZvwn4DdR8i0jlCpIOQize6TPQLxM bpg@bpg-test"
}