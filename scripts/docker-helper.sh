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

# Function to execute docker-compose commands
function dc {
  docker-compose "$@"
}

# Main function to handle commands
function main {
  check_dependencies

  case "$1" in
    up)
      echo -e "${GREEN}Starting all services...${NC}"
      dc up -d
      echo -e "${GREEN}Services are running in the background.${NC}"
      dc ps
      ;;
    down)
      echo -e "${YELLOW}Stopping all services...${NC}"
      dc down
      echo -e "${GREEN}All services stopped successfully.${NC}"
      ;;
    restart)
      echo -e "${YELLOW}Restarting all services...${NC}"
      dc down
      dc up -d
      echo -e "${GREEN}Services restarted successfully.${NC}"
      dc ps
      ;;
    logs)
      if [ -z "$2" ]; then
        echo -e "${GREEN}Showing logs from all services. Press Ctrl+C to exit.${NC}"
        dc logs -f
      else
        echo -e "${GREEN}Showing logs from $2. Press Ctrl+C to exit.${NC}"
        dc logs -f "$2"
      fi
      ;;
    build)
      echo -e "${YELLOW}Rebuilding all services...${NC}"
      dc build
      echo -e "${GREEN}Build completed successfully.${NC}"
      ;;
    ps)
      echo -e "${GREEN}Current services status:${NC}"
      dc ps
      ;;
    clean)
      echo -e "${YELLOW}Cleaning up Docker resources...${NC}"
      docker system prune -f
      docker volume prune -f
      echo -e "${GREEN}Cleanup completed successfully.${NC}"
      ;;
    help|*)
      show_usage
      ;;
  esac
}

# Execute main function with all arguments
main "$@" 