#!/bin/bash
set -e

# Configuration
PROJECT_NAME="devops-pipeline"
ENVIRONMENT=${1:-dev}
IMAGE_TAG=${2:-latest}
AWS_REGION=${3:-us-west-2}

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Ì∫Ä Deploying $PROJECT_NAME to $ENVIRONMENT environment...${NC}"

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}‚ùå AWS credentials not configured. Run 'aws configure' first.${NC}"
    exit 1
fi

# Build and tag Docker image
echo -e "${YELLOW}ÔøΩÔøΩ Building Docker image...${NC}"
docker build -t $PROJECT_NAME:$IMAGE_TAG .
docker tag $PROJECT_NAME:$IMAGE_TAG $PROJECT_NAME:latest

# Initialize and apply Terraform
echo -e "${YELLOW}ÌøóÔ∏è Provisioning infrastructure with Terraform...${NC}"
cd terraform

if [ ! -d ".terraform" ]; then
    echo "Initializing Terraform..."
    terraform init
fi

terraform plan -var="environment=$ENVIRONMENT" -var="project_name=$PROJECT_NAME"
terraform apply -var="environment=$ENVIRONMENT" -var="project_name=$PROJECT_NAME" -auto-approve

# Get outputs
VPC_ID=$(terraform output -raw vpc_id)
echo -e "${GREEN}Ì≥ã VPC ID: $VPC_ID${NC}"

cd ..

# For now, we'll use local Kubernetes (Docker Desktop)
echo -e "${YELLOW}‚ò∏Ô∏è Deploying to Kubernetes...${NC}"

# Create namespace
kubectl create namespace $ENVIRONMENT --dry-run=client -o yaml | kubectl apply -f -

# Apply Kubernetes manifests
kubectl apply -f k8s/ -n $ENVIRONMENT

# Wait for deployment
echo -e "${YELLOW}‚è≥ Waiting for deployment to be ready...${NC}"
kubectl rollout status deployment/devops-app -n $ENVIRONMENT --timeout=300s

# Get service information
echo -e "${YELLOW}Ìºê Getting service information...${NC}"
kubectl get services -n $ENVIRONMENT

echo -e "${GREEN}‚úÖ Deployment completed successfully!${NC}"
echo -e "${BLUE}Ì≥ä Check status: kubectl get all -n $ENVIRONMENT${NC}"
echo -e "${BLUE}Ì¥ç View logs: kubectl logs -f deployment/devops-app -n $ENVIRONMENT${NC}"
