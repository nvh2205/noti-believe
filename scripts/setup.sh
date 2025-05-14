#!/bin/bash

# Signal-Belive Project Setup Script
# This script clones the repository and sets up Docker containers

# Define colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print styled header
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}            SIGNAL-BELIVE PROJECT SETUP SCRIPT                  ${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo

# Default repository URL
DEFAULT_REPO="https://github.com/yourusername/signal-belive.git"
DEFAULT_BRANCH="main"
DEFAULT_DIR="signal-belive"

# Functions
function check_command() {
  if ! command -v $1 &> /dev/null; then
    echo -e "${RED}Error: $1 is not installed. Please install $1 and try again.${NC}"
    exit 1
  fi
}

function confirm() {
  read -p "$1 (y/n): " choice
  case "$choice" in 
    y|Y ) return 0;;
    * ) return 1;;
  esac
}

# Function to check Docker permissions
function check_docker_permissions() {
  # Try to run a simple docker command
  if ! docker info &>/dev/null; then
    OS=$(uname -s)
    echo -e "${RED}Error: Cannot connect to the Docker daemon.${NC}"
    
    if [ "$OS" = "Linux" ]; then
      echo -e "${YELLOW}It appears you don't have permission to access the Docker socket.${NC}"
      echo -e "To fix this issue, you can try one of the following solutions:"
      echo -e "1. Run this script with sudo:"
      echo -e "   ${BLUE}sudo $0${NC}"
      echo -e "2. Add your user to the docker group:"
      echo -e "   ${BLUE}sudo usermod -aG docker $USER${NC}"
      echo -e "   Then log out and log back in or run: ${BLUE}newgrp docker${NC}"
      
      if confirm "Would you like to add your user to the docker group now?"; then
        sudo usermod -aG docker $USER
        echo -e "${GREEN}User added to docker group.${NC}"
        echo -e "${YELLOW}Please log out and log back in, or run the following command and try again:${NC}"
        echo -e "${BLUE}newgrp docker${NC}"
        exit 1
      elif confirm "Would you like to continue running this script with sudo?"; then
        echo -e "${YELLOW}Restarting script with sudo...${NC}"
        exec sudo "$0" "$@"
      else
        echo -e "${RED}Setup cancelled.${NC}"
        exit 1
      fi
    else
      echo -e "${YELLOW}Please ensure Docker is running and you have proper permissions.${NC}"
      exit 1
    fi
  fi
}

# Check for required commands
echo -e "${YELLOW}Checking for required dependencies...${NC}"
check_command git
check_command docker
check_command docker-compose
echo -e "${GREEN}✓ All required dependencies are installed.${NC}"
echo

# Check Docker permissions
echo -e "${YELLOW}Checking Docker permissions...${NC}"
check_docker_permissions
echo -e "${GREEN}✓ Docker permissions are valid.${NC}"
echo

# Get repository information
read -p "Enter git repository URL [$DEFAULT_REPO]: " REPO_URL
REPO_URL=${REPO_URL:-$DEFAULT_REPO}

read -p "Enter branch name [$DEFAULT_BRANCH]: " BRANCH_NAME
BRANCH_NAME=${BRANCH_NAME:-$DEFAULT_BRANCH}

read -p "Enter directory to clone to [$DEFAULT_DIR]: " CLONE_DIR
CLONE_DIR=${CLONE_DIR:-$DEFAULT_DIR}

echo
echo -e "${YELLOW}Repository: ${NC}$REPO_URL"
echo -e "${YELLOW}Branch: ${NC}$BRANCH_NAME"
echo -e "${YELLOW}Directory: ${NC}$CLONE_DIR"
echo

# Confirm settings
if ! confirm "Do you want to proceed with these settings?"; then
  echo -e "${RED}Setup cancelled.${NC}"
  exit 1
fi

# Clone repository
echo
echo -e "${YELLOW}Cloning repository...${NC}"
if [ -d "$CLONE_DIR" ]; then
  echo -e "${RED}Directory $CLONE_DIR already exists.${NC}"
  if confirm "Do you want to remove it and continue?"; then
    rm -rf "$CLONE_DIR"
  else
    echo -e "${RED}Setup cancelled.${NC}"
    exit 1
  fi
fi

git clone -b "$BRANCH_NAME" "$REPO_URL" "$CLONE_DIR"

# Check if clone was successful
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to clone repository. Please check the URL and try again.${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Repository cloned successfully.${NC}"

# Navigate to the cloned directory
cd "$CLONE_DIR"
echo -e "${YELLOW}Changed to directory: ${NC}$(pwd)"

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
  echo -e "${RED}Error: docker-compose.yml not found in the repository.${NC}"
  exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
  echo -e "${YELLOW}Creating .env file...${NC}"
  cat > .env << EOL
# Application configuration
IS_API=0
IS_WORKER=1
APP_ENV=production
PORT=3001
NODE_ENV=production

# Database configuration
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=signal_belive
DB_DEBUG=1
DB_SYNC=1

# Redis configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_DATABASE=0
REDIS_PASSWORD=redis_password
REDIS_URL=redis://:redis_password@redis:6379
REDIS_FAMILY=0

# JWT configuration
JWT_SECRET=super_secret_key
EOL
  echo -e "${GREEN}✓ .env file created.${NC}"
else
  echo -e "${YELLOW}Note: .env file already exists, using existing file.${NC}"
fi

# Make helper scripts executable
if [ -f "scripts/docker-helper.sh" ]; then
  chmod +x scripts/docker-helper.sh
  echo -e "${GREEN}✓ Made docker-helper.sh executable.${NC}"
fi

# Start Docker containers
echo
echo -e "${YELLOW}Starting Docker containers...${NC}"
docker-compose up -d

# Check if docker-compose up was successful
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to start Docker containers.${NC}"
  echo -e "${YELLOW}If you're seeing permission errors, try:${NC}"
  echo -e "1. Run with sudo: ${BLUE}sudo docker-compose up -d${NC}"
  echo -e "2. Add your user to the docker group: ${BLUE}sudo usermod -aG docker $USER${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Docker containers started successfully.${NC}"

# Display running containers
echo
echo -e "${YELLOW}Running containers:${NC}"
docker-compose ps

# Print success message
echo
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}    Signal-Belive Project has been set up successfully!          ${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo
echo -e "${YELLOW}Services:${NC}"
echo -e "  - PostgreSQL: ${GREEN}Running${NC} (port 5432)"
echo -e "  - Redis: ${GREEN}Running${NC} (port 6379)"
echo -e "  - Worker: ${GREEN}Running${NC}"
echo
echo -e "${YELLOW}Useful commands:${NC}"
echo -e "  - View logs: ${BLUE}cd $CLONE_DIR && docker-compose logs -f${NC}"
echo -e "  - Stop services: ${BLUE}cd $CLONE_DIR && docker-compose down${NC}"
echo -e "  - Restart services: ${BLUE}cd $CLONE_DIR && docker-compose restart${NC}"
echo

# Exit successfully
exit 0 