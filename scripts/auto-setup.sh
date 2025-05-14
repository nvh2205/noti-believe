#!/bin/bash

# Signal-Belive Project Auto Setup Script
# This script automatically clones the repository and sets up Docker containers
# Designed for CI/CD or automated deployment scenarios

# Configuration (modify these variables as needed)
REPO_URL=${1:-"https://github.com/yourusername/signal-belive.git"}
BRANCH_NAME=${2:-"main"}
CLONE_DIR=${3:-"signal-belive"}

# Define colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "════════════════════════════════════════════════════════════════"
echo "            SIGNAL-BELIVE AUTO SETUP SCRIPT                     "
echo "════════════════════════════════════════════════════════════════"
echo

# Check for required commands
for cmd in git docker docker-compose; do
  if ! command -v $cmd &> /dev/null; then
    echo -e "${RED}Error: $cmd is not installed. Please install $cmd and try again.${NC}"
    exit 1
  fi
done

echo -e "${GREEN}✓ All required dependencies are installed.${NC}"
echo

# Check Docker permissions
echo -e "${YELLOW}Checking Docker permissions...${NC}"
if ! docker info &>/dev/null; then
  OS=$(uname -s)
  echo -e "${RED}Error: Cannot connect to the Docker daemon.${NC}"
  
  if [ "$OS" = "Linux" ]; then
    echo -e "${YELLOW}It appears you don't have permission to access the Docker socket.${NC}"
    echo -e "To fix this issue, you can try one of the following solutions:"
    echo -e "1. Run this script with sudo: ${RED}sudo $0 $REPO_URL $BRANCH_NAME $CLONE_DIR${NC}"
    echo -e "2. Add your user to the docker group and log out and log back in:"
    echo -e "   ${RED}sudo usermod -aG docker $USER${NC}"
    
    # For CI/CD environments, attempt to use sudo if available
    if command -v sudo &>/dev/null; then
      echo -e "${YELLOW}Attempting to restart with sudo...${NC}"
      exec sudo "$0" "$REPO_URL" "$BRANCH_NAME" "$CLONE_DIR"
    fi
  else
    echo -e "${YELLOW}Please ensure Docker is running and you have proper permissions.${NC}"
  fi
  
  exit 1
fi

echo -e "${GREEN}✓ Docker permissions are valid.${NC}"
echo

# Display configuration
echo -e "${YELLOW}Configuration:${NC}"
echo -e "Repository: $REPO_URL"
echo -e "Branch: $BRANCH_NAME"
echo -e "Directory: $CLONE_DIR"
echo

# Clone repository
echo -e "${YELLOW}Cloning repository...${NC}"
if [ -d "$CLONE_DIR" ]; then
  echo -e "${YELLOW}Directory $CLONE_DIR already exists. Removing...${NC}"
  rm -rf "$CLONE_DIR"
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
echo -e "${YELLOW}Changed to directory: $(pwd)${NC}"

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
  echo -e "${RED}Error: docker-compose.yml not found in the repository.${NC}"
  exit 1
fi

# Create .env file
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

# Make helper scripts executable
if [ -f "scripts/docker-helper.sh" ]; then
  chmod +x scripts/docker-helper.sh
  echo -e "${GREEN}✓ Made docker-helper.sh executable.${NC}"
fi

# Start Docker containers
echo -e "${YELLOW}Starting Docker containers...${NC}"
docker-compose down -v # Ensure clean start by removing existing containers and volumes
docker-compose up -d

# Check if docker-compose up was successful
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to start Docker containers.${NC}"
  echo -e "${YELLOW}If you're seeing permission errors on Ubuntu, you can fix them by:${NC}"
  echo -e "1. Running with sudo: ${RED}sudo $0 $REPO_URL $BRANCH_NAME $CLONE_DIR${NC}"
  echo -e "2. Adding your user to the docker group: ${RED}sudo usermod -aG docker $USER${NC}"
  echo -e "   Then log out and log back in."
  exit 1
fi

echo -e "${GREEN}✓ Docker containers started successfully.${NC}"

# Display running containers
echo -e "${YELLOW}Running containers:${NC}"
docker-compose ps

echo
echo -e "${GREEN}Signal-Belive Project has been set up successfully!${NC}"
echo

# Exit successfully
exit 0 