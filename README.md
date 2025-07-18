# 🚀 Complete DevOps Pipeline with Kubernetes & Monitoring

> **Bhai, yeh complete production-ready DevOps pipeline hai jisme everything included hai - Docker, Kubernetes, monitoring, scaling, everything!**

## 📋 Table of Contents
- [Project Overview](#-project-overview)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [Detailed Setup](#-detailed-setup)
- [File Structure](#-file-structure)
- [Code Explanation](#-code-explanation)
- [Features](#-features)
- [Screenshots](#-screenshots)
- [Troubleshooting](#-troubleshooting)

## 🎯 Project Overview

**Kya hai yeh project?**
Yeh ek complete DevOps pipeline hai jo demonstrate karta hai modern software deployment practices. Isme Node.js application hai jo Docker mein containerized hai, Kubernetes pe deployed hai with auto-scaling, monitoring, aur production-ready features.

**Why this project?**
- Industry-standard DevOps practices sikhane ke liye
- Real-world production environment simulate karna
- Complete CI/CD pipeline understanding
- Resume mein showcase karne ke liye perfect project

## 🛠️ Tech Stack

| Technology | Purpose | Why Used |
|------------|---------|----------|
| **Node.js + Express** | Backend Application | Fast, scalable JavaScript runtime |
| **Docker** | Containerization | Consistent deployment across environments |
| **Kubernetes** | Container Orchestration | Auto-scaling, load balancing, service discovery |
| **Prometheus** | Monitoring & Metrics | Real-time application monitoring |
| **Grafana** | Visualization | Beautiful dashboards for metrics |
| **Terraform** | Infrastructure as Code | Automated cloud infrastructure |
| **Jest** | Testing Framework | Automated testing for reliability |

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    DevOps Pipeline Architecture             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Node.js    │───▶│    Docker    │───▶│ Kubernetes   │  │
│  │  Application │    │  Container   │    │   Cluster    │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                   │         │
│  ┌──────────────┐    ┌──────────────┐           │         │
│  │  Prometheus  │◀───│   Grafana    │◀──────────┘         │
│  │  (Metrics)   │    │ (Dashboard)  │                     │
│  └──────────────┘    └──────────────┘                     │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┤
│  │  Load Balancer → Pod 1, Pod 2, Pod 3 (Auto-scaling)   │
│  └─────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────┘
```

## ⚡ Quick Start

**Bhai 5 minutes mein sab setup kar do:**

```bash
# 1. Repository clone karo
git clone https://github.com/yourusername/devops-pipeline
cd devops-pipeline

# 2. Setup script run karo (sab check ho jayega)
chmod +x scripts/*.sh
./scripts/setup.sh

# 3. Application deploy karo
kubectl create namespace dev
kubectl apply -f k8s/ -n dev

# 4. Monitoring setup karo
./scripts/monitor.sh

# 5. Access karo
curl http://localhost/        # Application
# Browser mein: localhost:9090 (Prometheus), localhost:3000 (Grafana)
```

## 🔧 Detailed Setup

### Prerequisites (Yeh sab installed hona chahiye)

```bash
# Check karo ki yeh sab installed hai
node --version    # v18+ required
npm --version     # Latest version
docker --version  # v20+ recommended
kubectl version   # Latest version
terraform --version # v1.0+ required (optional for cloud)
```

### Step 1: Application Setup

**1.1 Package.json banaya (Dependencies define kiye):**
```json
{
  "name": "devops-pipeline-app",
  "version": "1.0.0",
  "scripts": {
    "start": "node src/index.js",
    "test": "jest",
    "dev": "nodemon src/index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "helmet": "^7.1.0",
    "cors": "^2.8.5"
  }
}
```

**1.2 Main Application File (src/index.js):**
```javascript
const express = require('express');
const helmet = require('helmet'); // Security ke liye
const cors = require('cors');     // Cross-origin requests ke liye

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Main endpoint - Application info return karta hai
app.get('/', (req, res) => {
  res.json({
    message: '🚀 DevOps Pipeline App Running!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Health check endpoint - Kubernetes health checks ke liye
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
```

**Kyun banaya yeh application?**
- Simple hai lekin production-ready features hai
- Health checks included (Kubernetes ke liye zaroori)
- Security middleware (Helmet) included
- Environment-aware configuration

### Step 2: Docker Configuration

**2.1 Dockerfile (Multi-stage build):**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Dependencies install karo
COPY package*.json ./
RUN npm ci --only=production

# Source code copy karo
COPY src/ ./src/

# Security: Non-root user banao
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Health check define karo (Docker level pe)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

USER nodejs
EXPOSE 3000
CMD ["npm", "start"]
```

**Kyun multi-stage build?**
- Production mein sirf required files jaati hai
- Image size kam hota hai
- Security better hoti hai (non-root user)
- Health checks built-in hote hai

### Step 3: Kubernetes Configuration

**3.1 Deployment (k8s/deployment.yaml):**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: devops-app
  labels:
    app: devops-app
spec:
  replicas: 3  # 3 pods run honge (high availability)
  selector:
    matchLabels:
      app: devops-app
  template:
    metadata:
      labels:
        app: devops-app
    spec:
      containers:
      - name: devops-app
        image: devops-app:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        resources:
          requests:  # Minimum resources guarantee
            memory: "128Mi"
            cpu: "100m"
          limits:    # Maximum resources limit
            memory: "256Mi"
            cpu: "200m"
        # Health checks (Kubernetes automatically handle karega)
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

**3.2 Service (k8s/service.yaml):**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: devops-app-service
spec:
  type: LoadBalancer  # External access ke liye
  ports:
  - port: 80          # External port
    targetPort: 3000  # Container port
    protocol: TCP
  selector:
    app: devops-app   # Deployment ko target karta hai
```

**3.3 Auto-Scaling (k8s/hpa.yaml):**
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: devops-app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: devops-app
  minReplicas: 2      # Minimum 2 pods
  maxReplicas: 10     # Maximum 10 pods
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70  # 70% CPU pe scale up
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80  # 80% memory pe scale up
```

**Kubernetes kyun use kiya?**
- **Auto-scaling**: Traffic badhe toh automatically pods increase
- **Self-healing**: Pod crash ho jaye toh new pod start hota hai
- **Load balancing**: Traffic evenly distribute hota hai
- **Rolling updates**: Zero downtime mein updates kar sakte hai

### Step 4: Monitoring Setup

**4.1 Prometheus Configuration (monitoring/prometheus.yaml):**
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: monitoring
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s    # Har 15 second mein metrics collect
    
    scrape_configs:
      - job_name: 'kubernetes-pods'
        kubernetes_sd_configs:
          - role: pod
        # Automatically discover karta hai pods ko
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
            action: keep
            regex: true
```

**4.2 Grafana Setup (monitoring/grafana.yaml):**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: grafana
  namespace: monitoring
spec:
  replicas: 1
  template:
    spec:
      containers:
      - name: grafana
        image: grafana/grafana:10.1.0
        env:
        - name: GF_SECURITY_ADMIN_PASSWORD
          value: "admin123"    # Default password
        ports:
        - containerPort: 3000
        volumeMounts:
        - name: grafana-config
          mountPath: /etc/grafana/provisioning/datasources
```

**Monitoring kyun zaroori?**
- **Real-time visibility**: Application ka health pata chalta hai
- **Performance tracking**: CPU, memory, response time monitor kar sakte hai
- **Alerting**: Issues ke liye alerts set kar sakte hai
- **Debugging**: Problems troubleshoot karna easy ho jata hai

### Step 5: Automation Scripts

**5.1 Setup Script (scripts/setup.sh):**
```bash
#!/bin/bash
echo "🚀 Setting up DevOps Pipeline Project..."

# Required tools check karo
check_tool() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 is not installed"
        return 1
    else
        echo "✅ $1 is installed"
        return 0
    fi
}

# Dependencies install karo
npm install

# Docker image build karo
docker build -t devops-app:latest .

# Tests run karo
npm test
```

**5.2 Deploy Script (scripts/deploy.sh):**
```bash
#!/bin/bash
PROJECT_NAME="devops-pipeline"
ENVIRONMENT=${1:-dev}

echo "🚀 Deploying $PROJECT_NAME to $ENVIRONMENT environment..."

# Kubernetes namespace banao
kubectl create namespace $ENVIRONMENT --dry-run=client -o yaml | kubectl apply -f -

# Application deploy karo
kubectl apply -f k8s/ -n $ENVIRONMENT

# Deployment status check karo
kubectl rollout status deployment/devops-app -n $ENVIRONMENT --timeout=300s

echo "✅ Deployment completed successfully!"
```

## 📁 File Structure

```
devops-pipeline/
├── src/
│   ├── index.js           # Main application file
│   └── index.test.js      # Test cases
├── k8s/
│   ├── deployment.yaml    # Kubernetes deployment
│   ├── service.yaml       # Load balancer service
│   ├── configmap.yaml     # Configuration management
│   └── hpa.yaml          # Auto-scaling rules
├── monitoring/
│   ├── prometheus.yaml    # Metrics collection
│   └── grafana.yaml      # Visualization dashboard
├── terraform/
│   ├── main.tf           # Infrastructure definition
│   ├── variables.tf      # Input variables
│   ├── outputs.tf        # Output values
│   └── terraform.tfvars  # Variable values
├── scripts/
│   ├── setup.sh          # Project setup
│   ├── deploy.sh         # Deployment automation
│   └── monitor.sh        # Monitoring setup
├── Dockerfile            # Container definition
├── docker-compose.yml    # Development environment
├── package.json          # Dependencies
└── README.md            # Documentation
```

## 🚀 Features

### ✅ Production-Ready Features

1. **Containerization**
   - Multi-stage Docker builds
   - Security hardening (non-root user)
   - Health checks
   - Optimized image size

2. **Kubernetes Orchestration**
   - High availability (3 replicas)
   - Auto-scaling based on CPU/Memory
   - Rolling updates
   - Self-healing
   - Load balancing

3. **Monitoring & Observability**
   - Prometheus metrics collection
   - Grafana visualization
   - Health check endpoints
   - Application logs

4. **Development Workflow**
   - Automated testing with Jest
   - Development environment with docker-compose
   - Script automation
   - Code quality checks

5. **Infrastructure as Code**
   - Terraform for cloud deployment
   - Declarative Kubernetes manifests
   - Version controlled infrastructure

## 📊 Screenshots

### Application Running
```bash
$ curl http://localhost/
{
  "message": "🚀 DevOps Pipeline App Running!",
  "version": "1.0.0",
  "timestamp": "2025-07-18T17:55:03.095Z",
  "environment": "production"
}
```

### Kubernetes Pods Status
```bash
$ kubectl get pods -n dev
NAME                          READY   STATUS    RESTARTS   AGE
devops-app-5bff95d4cd-fclcm   1/1     Running   1          24h
devops-app-5bff95d4cd-jr7gt   1/1     Running   1          24h
devops-app-5bff95d4cd-nz8c6   1/1     Running   1          24h
```

### Load Balancing Test
```bash
$ for i in {1..3}; do curl http://localhost/; echo ""; done
{"message":"🚀 DevOps Pipeline App Running!","timestamp":"2025-07-18T17:55:03.095Z"}
{"message":"🚀 DevOps Pipeline App Running!","timestamp":"2025-07-18T17:55:04.229Z"}
{"message":"🚀 DevOps Pipeline App Running!","timestamp":"2025-07-18T17:55:05.321Z"}
```

## 🛠️ Commands Cheat Sheet

```bash
# Development
npm install              # Dependencies install
npm start               # Application start
npm test                # Tests run
npm run dev            # Development mode

# Docker
docker build -t devops-app .          # Image build
docker run -p 3000:3000 devops-app   # Container run
docker ps                             # Running containers

# Kubernetes
kubectl get all -n dev                    # All resources check
kubectl get pods -n dev                   # Pods status
kubectl logs -f deployment/devops-app    # Logs check
kubectl describe pod <pod-name>           # Pod details
kubectl port-forward svc/service 8080:80 # Port forward

# Monitoring
kubectl port-forward svc/prometheus 9090:9090 -n monitoring  # Prometheus access
kubectl port-forward svc/grafana 3000:3000 -n monitoring     # Grafana access

# Cleanup
kubectl delete namespace dev          # Remove application
kubectl delete namespace monitoring   # Remove monitoring
docker system prune                  # Clean Docker
```

## 🐛 Troubleshooting

### Common Issues aur Solutions

**1. Docker Build Failing**
```bash
# Problem: Dependencies install nahi ho rahe
# Solution: Cache clear karo
docker system prune
docker build --no-cache -t devops-app .
```

**2. Kubernetes Pods Stuck in Pending**
```bash
# Problem: Resources ki kami
# Solution: Resources check karo
kubectl describe nodes
kubectl get events -n dev
```

**3. Application Not Accessible**
```bash
# Problem: Service properly expose nahi hui
# Solution: Service check karo
kubectl get services -n dev
kubectl port-forward svc/devops-app-service 8080:80 -n dev
```

**4. Monitoring Not Working**
```bash
# Problem: Prometheus/Grafana pods not ready
# Solution: Logs check karo
kubectl logs -f deployment/prometheus -n monitoring
kubectl logs -f deployment/grafana -n monitoring
```

## 🎯 Next Steps & Improvements

### Immediate Enhancements
- [ ] Add CI/CD pipeline with GitHub Actions
- [ ] Implement proper logging (ELK stack)
- [ ] Add security scanning (Trivy, OWASP)
- [ ] Database integration (PostgreSQL/MongoDB)
- [ ] API authentication (JWT, OAuth)

### Advanced Features
- [ ] Service mesh (Istio)
- [ ] GitOps with ArgoCD
- [ ] Chaos engineering
- [ ] Performance testing
- [ ] Multi-environment setup

### Cloud Migration
- [ ] AWS EKS deployment
- [ ] Google GKE setup
- [ ] Azure AKS configuration
- [ ] Cost optimization

## 🤝 Contributing

**Contribute karna hai?**

1. Fork the repository
2. Feature branch banao (`git checkout -b feature/amazing-feature`)
3. Changes commit karo (`git commit -m 'Add amazing feature'`)
4. Branch push karo (`git push origin feature/amazing-feature`)
5. Pull Request create karo

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Priyanshu Singh**
- Portfolio: [priyanshu-singh.vercel.app](https://priyanshu-singh.vercel.app)
- LinkedIn: [Connect with me](https://linkedin.com/in/priyanshu-singh)
- GitHub: [@dev-priyanshu15](https://github.com/dev-priyanshu15)

## 🙏 Acknowledgments

- Docker community for amazing containerization tools
- Kubernetes team for orchestration platform
- Prometheus & Grafana for monitoring solutions
- Express.js team for the web framework
- Open source community for making this possible

---

**⭐ Agar project pasand aaya ho toh star kar dena bhai! Aur koi doubt ho toh issues mein puch lena.**

*Built with ❤️ for the DevOps community*