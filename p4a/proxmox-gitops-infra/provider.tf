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
  pm_api_url      = "https://192.168.10.214:8006/api2/json"
  pm_user         = "terraform-prov@pve"
  pm_password     = var.pm_password
  pm_tls_insecure = true
}