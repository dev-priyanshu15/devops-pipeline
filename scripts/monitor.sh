#!/bin/bash
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Ì≥ä Setting up monitoring stack...${NC}"

# Check if kubectl is working
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${RED}‚ùå kubectl not configured or cluster not accessible${NC}"
    exit 1
fi

# Create monitoring namespace
echo -e "${YELLOW}Ì≥Å Creating monitoring namespace...${NC}"
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -

# Deploy Prometheus
echo -e "${YELLOW}Ì¥ç Deploying Prometheus...${NC}"
kubectl apply -f monitoring/prometheus.yaml

# Deploy Grafana
echo -e "${YELLOW}Ì≥à Deploying Grafana...${NC}"
kubectl apply -f monitoring/grafana.yaml

# Wait for deployments
echo -e "${YELLOW}‚è≥ Waiting for monitoring stack to be ready...${NC}"
kubectl wait --for=condition=available --timeout=300s deployment/prometheus -n monitoring
kubectl wait --for=condition=available --timeout=300s deployment/grafana -n monitoring

# Get service information
echo -e "${YELLOW}Ìºê Getting monitoring services...${NC}"
kubectl get services -n monitoring

echo -e "${GREEN}‚úÖ Monitoring stack deployed successfully!${NC}"
echo ""
echo -e "${BLUE}Ì≥ä Access Information:${NC}"
echo -e "${YELLOW}Prometheus:${NC}"
echo "  kubectl port-forward svc/prometheus 9090:9090 -n monitoring"
echo "  Then open: http://localhost:9090"
echo ""
echo -e "${YELLOW}Grafana:${NC}"
echo "  kubectl port-forward svc/grafana 3000:3000 -n monitoring"
echo "  Then open: http://localhost:3000"
echo "  Default credentials: admin/admin123"
echo ""
echo -e "${BLUE}Ì≤° Tip: Run these commands in separate terminals to access the monitoring tools${NC}"
