terraform {
  required_providers {
    proxmox = {
      source  = "Telmate/proxmox"
      version = "3.0.2-rc04"
    }
  }
}

provider "proxmox" {
  pm_api_url      = "https://192.168.10.214:8006/api2/json" # IP Proxmox
  pm_user         = "terraform-prov@pve"
  pm_password     = var.pm_password
  pm_tls_insecure = true

}