#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Clear screen
clear

echo "========================================="
echo "   WAMCPanel VPS Initialization Script  "
echo "========================================="
echo "This script installs Docker, Node.js (LTS), Git, and configures"
echo "system environment permissions to run WAMCPanel."
echo "========================================="
echo ""

# Ensure script is run with sudo privileges
if [ "$EUID" -ne 0 ]; then
  echo "[-] Please run this script with sudo privileges:"
  echo "    sudo bash $0"
  exit 1
fi

# Detect actual non-root user
REAL_USER=${SUDO_USER:-$USER}
if [ "$REAL_USER" = "root" ]; then
  echo "[!] Warning: Running as root. No non-root user detected for Docker groups."
fi

# Update package lists
echo "[+] Updating apt repositories..."
apt-get update -y

# Install prerequisites
echo "[+] Installing system prerequisites..."
apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    git \
    build-essential

# Install Docker if not present
if ! command -v docker &> /dev/null; then
  echo "[+] Installing Docker Engine..."
  mkdir -p /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg --yes
  
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
    $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
  echo "[+] Docker Engine installed successfully."
else
  echo "[~] Docker is already installed."
fi

# Configure Docker permissions
if [ "$REAL_USER" != "root" ]; then
  echo "[+] Adding user '$REAL_USER' to the docker group..."
  groupadd -f docker
  usermod -aG docker "$REAL_USER"
  echo "[+] Group permissions configured. You may need to log out and log back in for changes to take effect."
fi



# Create directory structure for panel
INSTALL_DIR="/opt/wamcpanel"
echo "[+] Setting up installation workspace at $INSTALL_DIR..."
mkdir -p "$INSTALL_DIR"
if [ "$REAL_USER" != "root" ]; then
  chown -R "$REAL_USER":"$REAL_USER" "$INSTALL_DIR"
fi

# Clone repository
if [ ! -d "$INSTALL_DIR/.git" ]; then
  echo "[+] Cloning WAMCPanel repository to $INSTALL_DIR..."
  if [ "$REAL_USER" != "root" ]; then
    sudo -u "$REAL_USER" git clone https://github.com/arielbatoon09/wamcpanel.git "$INSTALL_DIR"
  else
    git clone https://github.com/arielbatoon09/wamcpanel.git "$INSTALL_DIR"
  fi
  echo "[+] Repository cloned successfully."
else
  echo "[~] Repository already cloned at $INSTALL_DIR."
fi

# Copy .env configuration templates
echo "[+] Initializing environment files..."
if [ -f "$INSTALL_DIR/.env.prod.example" ] && [ ! -f "$INSTALL_DIR/.env" ]; then
  cp "$INSTALL_DIR/.env.prod.example" "$INSTALL_DIR/.env"
  if [ "$REAL_USER" != "root" ]; then
    chown "$REAL_USER":"$REAL_USER" "$INSTALL_DIR/.env"
  fi
  echo "[+] Root environment file created."
fi

# Pre-create SFTP host key placeholder so Docker mounts it as a file (not a folder)
if [ ! -f "$INSTALL_DIR/backend/sftp_host_key" ]; then
  touch "$INSTALL_DIR/backend/sftp_host_key"
  if [ "$REAL_USER" != "root" ]; then
    chown "$REAL_USER":"$REAL_USER" "$INSTALL_DIR/backend/sftp_host_key"
  fi
  echo "[+] SFTP host key placeholder created."
fi

echo ""
echo "========================================="
echo "       Initialization Complete!         "
echo "========================================="
echo "Next Steps to run WAMCPanel via Docker:"
echo " 1. Move to workspace: cd $INSTALL_DIR"
echo " 2. Update configuration secrets in root .env file:"
echo "    nano .env"
echo " 3. Build & start the container stacks:"
echo "    docker compose up -d --build"
echo "========================================="