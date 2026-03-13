#!/bin/bash
# ============================================================
# MREC Platform — Quick Start Script
# ============================================================
set -e

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BOLD}${CYAN}"
echo "  __  __ ___ ___ ___   ____  _      _    _    __  __"
echo " |  \/  | _ \ __/ __| |  _ \| |    /_\  | |  |  \/  |"
echo " | |\/| |   / _| (__  | |_) | |__ / _ \ | |__| |\/| |"
echo " |_|  |_|_|_\___\___| |____/|____/_/ \_\|____|_|  |_|"
echo -e "${NC}"
echo -e "${BOLD}White-Label Music Distribution Platform${NC}"
echo "=================================================="
echo ""

# Check dependencies
echo -e "${YELLOW}Checking dependencies...${NC}"
command -v docker >/dev/null 2>&1 || { echo -e "${RED}Docker is required but not installed. Aborting.${NC}"; exit 1; }
command -v docker-compose >/dev/null 2>&1 || command -v "docker compose" >/dev/null 2>&1 || { echo -e "${RED}Docker Compose is required but not installed.${NC}"; exit 1; }
echo -e "${GREEN}✓ Docker available${NC}"

# Copy env files if they don't exist
if [ ! -f "apps/backend/.env" ]; then
  cp apps/backend/.env.example apps/backend/.env
  echo -e "${YELLOW}⚠  Created apps/backend/.env from example. Please configure AWS credentials!${NC}"
fi

if [ ! -f "apps/frontend/.env.local" ]; then
  cp apps/frontend/.env.local.example apps/frontend/.env.local
  echo -e "${YELLOW}⚠  Created apps/frontend/.env.local from example.${NC}"
fi

echo ""
echo -e "${YELLOW}Starting services...${NC}"
docker-compose up -d postgres redis

echo ""
echo -e "${YELLOW}Waiting for database to be ready...${NC}"
sleep 5
until docker-compose exec -T postgres pg_isready -U mrec > /dev/null 2>&1; do
  printf '.'
  sleep 1
done
echo -e " ${GREEN}✓ Database ready${NC}"

echo ""
echo -e "${YELLOW}Starting application...${NC}"
docker-compose up -d

echo ""
echo -e "${YELLOW}Waiting for backend to be ready...${NC}"
sleep 8
until curl -s http://localhost:3001/api/v1/auth/me > /dev/null 2>&1; do
  printf '.'
  sleep 2
done
echo -e " ${GREEN}✓ Backend ready${NC}"

echo ""
echo -e "${GREEN}${BOLD}🎉 MREC Platform is running!${NC}"
echo ""
echo -e "  ${BOLD}Frontend:${NC}      http://localhost:3000"
echo -e "  ${BOLD}Backend API:${NC}   http://localhost:3001"
echo -e "  ${BOLD}Swagger Docs:${NC}  http://localhost:3001/api/docs"
echo ""
echo -e "  ${BOLD}Default Admin:${NC} admin@mrec.io"
echo -e "  ${BOLD}Password:${NC}      Admin@123456"
echo ""
echo -e "  ${RED}⚠  Change admin password immediately!${NC}"
echo -e "  ${YELLOW}⚠  Add your AWS credentials to apps/backend/.env${NC}"
echo ""
echo -e "  ${CYAN}Logs:${NC} docker-compose logs -f"
echo -e "  ${CYAN}Stop:${NC} docker-compose down"
echo ""
