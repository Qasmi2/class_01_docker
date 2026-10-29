resource "proxmox_vm_qemu" "kubernetes_cluster" {
  for_each    = var.infrastructure_vms
  name        = each.key
  vmid        = each.value.vmid
  target_node = "pve-02"

  clone = "ubuntu-2404-template"

  cores   = each.value.cores
  sockets = 1
  memory  = each.value.memory
  scsihw  = "virtio-scsi-pci"
  agent   = 1
  agent_timeout = 300

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

  os_type   = "cloud-init"
  ipconfig0 = "ip=${each.value.ip},gw=192.168.10.1"
  ciuser    = "devops"
  sshkeys   = var.ssh_public_key
}