#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting update process...${NC}"

# Step 1: Pull latest code
echo -e "${YELLOW}Pulling latest code from repository...${NC}"
if git pull; then
    echo -e "${GREEN}Code successfully updated!${NC}"
else
    echo -e "${RED}Failed to pull latest code. Please check your git configuration.${NC}"
    echo -e "${YELLOW}You might need to run: git config --global --add safe.directory $(pwd)${NC}"
    exit 1
fi

# Step 2: Rebuild Docker containers
echo -e "${YELLOW}Rebuilding Docker containers...${NC}"
if docker-compose down; then
    echo -e "${GREEN}Docker containers stopped successfully.${NC}"
else
    echo -e "${RED}Failed to stop Docker containers.${NC}"
    exit 1
fi

echo -e "${YELLOW}Building and starting Docker containers...${NC}"
if docker-compose up --build -d; then
    echo -e "${GREEN}Docker containers rebuilt and started successfully!${NC}"
else
    echo -e "${RED}Failed to rebuild Docker containers.${NC}"
    exit 1
fi

# Step 3: Check container status
echo -e "${YELLOW}Checking container status...${NC}"
docker-compose ps

echo -e "${GREEN}Update process completed successfully!${NC}"
echo -e "${YELLOW}You can check the logs with: docker-compose logs -f${NC}" 