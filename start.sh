#!/bin/bash

# Social Group Buying Startup Script

# Color Codes
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}==================================================${NC}"
echo -e "${GREEN}🚀 Welcome to the Social Group Buying Setup Helper${NC}"
echo -e "${CYAN}==================================================${NC}"

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

echo -e "Node version: $(node -v)"
echo -e "NPM version:  $(npm -v)"

echo -e "\n${YELLOW}Choose an action:${NC}"
echo -e "1) Initialise PostgreSQL Database Schema (Requires local database running)"
echo -e "2) Run Backend Express API Server (development mode)"
echo -e "3) Run Frontend Vite Development Client"
echo -e "4) Exit"
read -p "Enter Choice (1-4): " choice

case $choice in
    1)
        echo -e "\n${CYAN}Running database migrations...${NC}"
        cd backend
        npm run db:init
        ;;
    2)
        echo -e "\n${CYAN}Starting Backend server...${NC}"
        cd backend
        npm run dev
        ;;
    3)
        echo -e "\n${CYAN}Starting Frontend Client...${NC}"
        cd frontend
        npm run dev
        ;;
    4)
        echo -e "\n${GREEN}Exiting. Good luck!${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid selection.${NC}"
        exit 1
        ;;
esac
