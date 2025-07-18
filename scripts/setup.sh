#!/bin/bash
set -e

echo "� Setting up DevOps Pipeline Project..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if required tools are installed
check_tool() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}❌ $1 is not installed${NC}"
        return 1
    else
        echo -e "${GREEN}✅ $1 is installed${NC}"
        return 0
    fi
}

echo "� Checking required tools..."
TOOLS_OK=true

check_tool "docker" || TOOLS_OK=false
check_tool "kubectl" || TOOLS_OK=false
check_tool "terraform" || TOOLS_OK=false
check_tool "aws" || TOOLS_OK=false
check_tool "node" || TOOLS_OK=false
check_tool "npm" || TOOLS_OK=false

if [ "$TOOLS_OK" = false ]; then
    echo -e "${RED}❌ Please install missing tools before continuing${NC}"
    exit 1
fi

# Install Node.js dependencies if not already installed
if [ ! -d "node_modules" ]; then
    echo "� Installing Node.js dependencies..."
    npm install
fi

# Build Docker image
echo "� Building Docker image..."
docker build -t devops-app:latest .

# Run tests
echo "� Running tests..."
npm test

echo -e "${GREEN}✅ Setup complete!${NC}"
echo -e "${YELLOW}� Next steps:${NC}"
echo "1. Configure AWS credentials: aws configure"
echo "2. Initialize Terraform: cd terraform && terraform init"
echo "3. Deploy infrastructure: ./scripts/deploy.sh"
