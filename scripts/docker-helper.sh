#!/bin/bash

# Script to help with Docker-related operations
# Usage: ./scripts/docker-helper.sh [command]
# 
# Note: RabbitMQ and microservice have been removed from the configuration
# Current services: postgres, redis, api, worker

set -e

# Define colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to display usage information
function show_usage {
  echo -e "${YELLOW}Usage:${NC} $0 [command]"
  echo
  echo "Commands:"
  echo "  up       - Start all services in detached mode"
  echo "  down     - Stop all services and remove containers"
  echo "  restart  - Restart all services"
  echo "  logs     - Show logs from all services"
  echo "  build    - Rebuild all services"
  echo "  ps       - Show status of services"
  echo "  clean    - Remove all unused Docker resources"
  echo "  fix-perms - Fix Docker socket permissions on Ubuntu"
  echo "  help     - Show this help message"
  echo
}

# Check if Docker and Docker Compose are installed
function check_dependencies {
  if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
    exit 1
  fi

  if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
  fi
}

# Check Docker permissions
function check_docker_permissions {
  # Try to run a simple docker command
  if ! docker info &>/dev/null; then
    OS=$(uname -s)
    echo -e "${RED}Error: Cannot connect to the Docker daemon.${NC}"
    
    if [ "$OS" = "Linux" ]; then
      echo -e "${YELLOW}It appears you don't have permission to access the Docker socket.${NC}"
      echo -e "You can fix this by running: ${BLUE}sudo $0 fix-perms${NC}"
      echo -e "Or run this command with sudo: ${BLUE}sudo $0 $1${NC}"
    else
      echo -e "${YELLOW}Please ensure Docker is running and you have proper permissions.${NC}"
    fi
    
    exit 1
  fi
}

# Function to fix Docker permissions on Ubuntu
function fix_docker_permissions {
  OS=$(uname -s)
  if [ "$OS" != "Linux" ]; then
    echo -e "${YELLOW}This command is only applicable on Linux systems.${NC}"
    exit 1
  fi
  
  echo -e "${YELLOW}Fixing Docker permissions...${NC}"
  if ! command -v sudo &> /dev/null; then
    echo -e "${RED}Error: sudo is not installed. Please run as root or install sudo.${NC}"
    exit 1
  fi
  
  # Check if user is already in docker group
  if groups | grep -q '\bdocker\b'; then
    echo -e "${GREEN}User already belongs to the docker group.${NC}"
  else
    echo -e "${YELLOW}Adding user to the docker group...${NC}"
    sudo usermod -aG docker $USER
    echo -e "${GREEN}User added to docker group.${NC}"
  fi
  
  echo -e "${YELLOW}Restarting Docker service...${NC}"
  sudo systemctl restart docker
  
  echo -e "${GREEN}Docker permissions fixed. You may need to log out and log back in.${NC}"
  echo -e "Alternatively, you can run this command to apply changes immediately:"
  echo -e "${BLUE}newgrp docker${NC}"
  
  exit 0
}

# Function to execute docker-compose commands
function dc {
  docker-compose "$@"
}

# Handle command execution errors
function handle_error {
  echo -e "${RED}Command failed with error code $?.${NC}"
  
  OS=$(uname -s)
  if [ "$OS" = "Linux" ]; then
    echo -e "${YELLOW}If you're seeing permission errors, try:${NC}"
    echo -e "1. Fix permissions: ${BLUE}$0 fix-perms${NC}"
    echo -e "2. Run with sudo: ${BLUE}sudo $0 $1${NC}"
  else
    echo -e "${YELLOW}Please ensure Docker is running correctly and you have proper permissions.${NC}"
  fi
  
  exit 1
}

# Main function to handle commands
function main {
  check_dependencies
  
  # Special case for fix-perms command that doesn't require Docker access
  if [ "$1" = "fix-perms" ]; then
    fix_docker_permissions
    exit 0
  fi
  
  # Check Docker permissions for all other commands
  check_docker_permissions "$1"

  case "$1" in
    up)
      echo -e "${GREEN}Starting all services...${NC}"
      dc up -d || handle_error "$1"
      echo -e "${GREEN}Services are running in the background.${NC}"
      dc ps
      ;;
    down)
      echo -e "${YELLOW}Stopping all services...${NC}"
      dc down || handle_error "$1"
      echo -e "${GREEN}All services stopped successfully.${NC}"
      ;;
    restart)
      echo -e "${YELLOW}Restarting all services...${NC}"
      dc down || handle_error "$1"
      dc up -d || handle_error "$1"
      echo -e "${GREEN}Services restarted successfully.${NC}"
      dc ps
      ;;
    logs)
      if [ -z "$2" ]; then
        echo -e "${GREEN}Showing logs from all services. Press Ctrl+C to exit.${NC}"
        dc logs -f || handle_error "$1"
      else
        echo -e "${GREEN}Showing logs from $2. Press Ctrl+C to exit.${NC}"
        dc logs -f "$2" || handle_error "$1"
      fi
      ;;
    build)
      echo -e "${YELLOW}Rebuilding all services...${NC}"
      dc build || handle_error "$1"
      echo -e "${GREEN}Build completed successfully.${NC}"
      ;;
    ps)
      echo -e "${GREEN}Current services status:${NC}"
      dc ps || handle_error "$1"
      ;;
    clean)
      echo -e "${YELLOW}Cleaning up Docker resources...${NC}"
      docker system prune -f || handle_error "$1"
      docker volume prune -f || handle_error "$1"
      echo -e "${GREEN}Cleanup completed successfully.${NC}"
      ;;
    help|*)
      show_usage
      ;;
  esac
}

# Execute main function with all arguments
main "$@" 