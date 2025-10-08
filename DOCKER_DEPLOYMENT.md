# 🐳 MealLoop Docker & DevOps Deployment Guide

This guide provides comprehensive instructions for deploying MealLoop using Docker containers with modern DevOps practices.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Development Environment](#development-environment)
- [Production Deployment](#production-deployment)
- [CI/CD Pipeline](#cicd-pipeline)
- [Monitoring & Logging](#monitoring--logging)
- [Security Best Practices](#security-best-practices)
- [Troubleshooting](#troubleshooting)

## 🚀 Prerequisites

### Required Software
- **Docker**: Version 20.10+ ([Install Docker](https://docs.docker.com/get-docker/))
- **Docker Compose**: Version 2.0+ ([Install Compose](https://docs.docker.com/compose/install/))
- **Git**: For version control
- **Node.js**: 20.18.0+ (for local development)

### Required Accounts & Services
- **MongoDB Atlas**: For production database ([Sign up](https://www.mongodb.com/atlas))
- **Cloudinary**: For image storage ([Sign up](https://cloudinary.com/))
- **Google Cloud**: For Maps API ([Get API Key](https://developers.google.com/maps/documentation/javascript/get-api-key))
- **GitHub**: For CI/CD pipelines
- **Container Registry**: GitHub Container Registry (GHCR) or Docker Hub

## ⚡ Quick Start

### 1. Clone & Setup
```bash
git clone https://github.com/Abhishek131005/Mealloop.git
cd Mealloop
cp .env.example .env
# Edit .env with your actual values
```

### 2. Start Development Environment
```bash
# Using helper script (Linux/macOS)
chmod +x scripts/docker-dev.sh
./scripts/docker-dev.sh up

# Or using Docker Compose directly
docker-compose -f docker-compose.dev.yml up -d
```

### 3. Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health
- **MongoDB**: localhost:27017

## 🛠 Development Environment

### Architecture Overview
```
┌─────────────────────────────────────────────────────────┐
│                    Development Stack                    │
├─────────────────────────────────────────────────────────┤
│  Frontend (React + Vite)     │  Backend (Node.js)       │
│  Port: 3000                  │  Port: 5000               │
│  Hot Module Reload           │  Nodemon Auto-restart     │
├─────────────────────────────────────────────────────────┤
│             Nginx Reverse Proxy (Optional)              │
│                        Port: 80                         │
├─────────────────────────────────────────────────────────┤
│  MongoDB          │  Redis Cache       │  File Storage  │
│  Port: 27017      │  Port: 6379        │  Volume Mount  │
└─────────────────────────────────────────────────────────┘
```

### Development Commands
```bash
# Start all services
./scripts/docker-dev.sh up

# View logs
./scripts/docker-dev.sh logs

# Check status
./scripts/docker-dev.sh status

# Stop all services
./scripts/docker-dev.sh down

# Clean everything
./scripts/docker-dev.sh clean
```

### Environment Configuration
Create `.env` file with development values:
```env
# Database
MONGODB_URI=mongodb://admin:password123@mongodb:27017/mealloop_dev?authSource=admin

# JWT
JWT_SECRET=your-super-secret-jwt-key-for-development

# External Services
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Frontend
VITE_API_BASE_URL=http://localhost:5000/api
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
VITE_CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=your-upload-preset
```

## 🚀 Production Deployment

### Architecture Overview
```
┌─────────────────────────────────────────────────────────┐
│                    Production Stack                     │
├─────────────────────────────────────────────────────────┤
│            Nginx Load Balancer + SSL                    │
│              Port: 80/443 (HTTPS)                       │
├─────────────────────────────────────────────────────────┤
│  Frontend (Nginx)       │  Backend (Node.js)            │
│  Static Files           │  API + Socket.IO               │
│  Gzip Compression       │  Process Management            │
├─────────────────────────────────────────────────────────┤
│  MongoDB Atlas     │  Redis Cluster    │  Cloudinary    │
│  (External)        │  (External/Local) │  (External)    │
└─────────────────────────────────────────────────────────┘
```

### Production Setup

#### 1. Server Preparation
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.21.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 2. Application Deployment
```bash
# Clone repository
git clone https://github.com/Abhishek131005/Mealloop.git
cd Mealloop

# Setup production environment
cp .env.example .env
# Edit .env with production values

# Deploy
chmod +x scripts/docker-prod.sh
./scripts/docker-prod.sh deploy
```

#### 3. Production Environment Variables
```env
# Database (MongoDB Atlas)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mealloop_prod

# Security
JWT_SECRET=your-super-long-and-complex-jwt-secret-for-production
REDIS_PASSWORD=your-redis-password

# External Services
CLOUDINARY_CLOUD_NAME=your-production-cloudinary
CLOUDINARY_API_KEY=your-production-api-key
CLOUDINARY_API_SECRET=your-production-api-secret
GOOGLE_MAPS_API_KEY=your-production-maps-key

# Frontend
VITE_API_BASE_URL=https://api.yourdomain.com/api
VITE_GOOGLE_MAPS_API_KEY=your-production-maps-key
VITE_CLOUDINARY_CLOUD_NAME=your-production-cloudinary
VITE_CLOUDINARY_UPLOAD_PRESET=your-production-preset
```

### Production Commands
```bash
# Deploy application
./scripts/docker-prod.sh deploy

# Rolling update
./scripts/docker-prod.sh update

# Check health
./scripts/docker-prod.sh health

# View logs
./scripts/docker-prod.sh logs

# Create backup
./scripts/docker-prod.sh backup

# Monitor resources
./scripts/docker-prod.sh status
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow
The automated CI/CD pipeline includes:

1. **Code Quality Checks**
   - ESLint for code quality
   - Security vulnerability scanning
   - Docker image security scanning with Trivy

2. **Build & Test**
   - Multi-stage Docker builds
   - Automated testing (when tests are added)
   - Image optimization

3. **Container Registry**
   - Push to GitHub Container Registry
   - Semantic versioning with tags
   - Multi-architecture builds

4. **Deployment**
   - Automated deployment to production
   - Rolling updates with zero downtime
   - Health checks and rollback capabilities

### Setup CI/CD
1. **GitHub Secrets Configuration**:
   ```
   PRODUCTION_HOST=your-server-ip
   PRODUCTION_USER=your-server-user
   PRODUCTION_SSH_KEY=your-private-ssh-key
   GOOGLE_MAPS_API_KEY=your-maps-api-key
   CLOUDINARY_CLOUD_NAME=your-cloudinary-name
   CLOUDINARY_UPLOAD_PRESET=your-upload-preset
   VITE_API_BASE_URL=https://api.yourdomain.com/api
   SLACK_WEBHOOK_URL=your-slack-webhook-url
   ```

2. **Enable GitHub Actions**:
   - Push to `main` branch triggers deployment
   - Pull requests trigger build and test only
   - Manual deployment available in Actions tab

## 📊 Monitoring & Logging

### Prometheus + Grafana Stack
Optional monitoring setup for production environments:

```bash
# Start monitoring services
docker-compose -f docker-compose.prod.yml --profile monitoring up -d

# Access dashboards
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3001 (admin/admin)
```

### Key Metrics Monitored
- **Application Performance**
  - Response times
  - Request rates
  - Error rates
  - Active users

- **System Resources**
  - CPU usage
  - Memory consumption
  - Disk I/O
  - Network traffic

- **Database Performance**
  - Connection pool status
  - Query performance
  - Cache hit rates

### Log Management
```bash
# View application logs
docker-compose logs -f backend frontend

# View nginx access logs
docker-compose exec nginx tail -f /var/log/nginx/access.log

# View system logs
docker-compose logs -f mongodb redis
```

## 🔐 Security Best Practices

### Container Security
- ✅ **Non-root users**: All containers run as non-privileged users
- ✅ **Multi-stage builds**: Minimal production images
- ✅ **Security scanning**: Trivy scans for vulnerabilities
- ✅ **Read-only filesystems**: Where applicable
- ✅ **Resource limits**: CPU and memory constraints

### Network Security
- ✅ **Internal networks**: Services communicate on private networks
- ✅ **Rate limiting**: API endpoints protected against abuse
- ✅ **CORS configuration**: Proper cross-origin settings
- ✅ **Headers**: Security headers implemented

### Data Security
- ✅ **Environment variables**: Secrets stored securely
- ✅ **Database encryption**: MongoDB encryption at rest
- ✅ **SSL/TLS**: HTTPS enforcement in production
- ✅ **Input validation**: Server-side validation

### Production Security Checklist
- [ ] Change default passwords
- [ ] Configure firewall rules
- [ ] Set up SSL certificates
- [ ] Enable audit logging
- [ ] Configure backup encryption
- [ ] Implement monitoring alerts
- [ ] Regular security updates

## 🔧 Troubleshooting

### Common Issues

#### 1. Container Won't Start
```bash
# Check container logs
docker-compose logs [service-name]

# Check container status
docker-compose ps

# Rebuild container
docker-compose build --no-cache [service-name]
```

#### 2. Database Connection Issues
```bash
# Check MongoDB container
docker-compose logs mongodb

# Test connectivity
docker-compose exec backend npm run test-db

# Check environment variables
docker-compose exec backend printenv | grep MONGO
```

#### 3. Frontend Build Failures
```bash
# Check build logs
docker-compose logs frontend

# Check environment variables
docker-compose exec frontend printenv | grep VITE

# Rebuild with fresh dependencies
docker-compose build --no-cache frontend
```

#### 4. Performance Issues
```bash
# Check resource usage
docker stats

# Check system resources
./scripts/docker-prod.sh status

# Scale services
docker-compose up -d --scale backend=2
```

### Health Checks
```bash
# Backend health
curl http://localhost:5000/api/health

# Frontend health
curl http://localhost:3000/health

# Database connectivity
docker-compose exec mongodb mongosh --eval "db.runCommand('ping')"
```

### Debug Mode
```bash
# Start with debug logging
docker-compose -f docker-compose.dev.yml up -d
docker-compose exec backend npm run debug

# Enable verbose logging
export DEBUG=*
docker-compose up
```

## 📚 Additional Resources

### Documentation Links
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [MongoDB Docker](https://hub.docker.com/_/mongo)
- [Nginx Docker](https://hub.docker.com/_/nginx)
- [Node.js Docker](https://hub.docker.com/_/node)

### MealLoop Specific
- [API Documentation](./API.md)
- [Contributing Guidelines](./CONTRIBUTING.md)
- [Frontend Documentation](./frontend/README.md)
- [Backend Documentation](./backend/README.md)

### Support
- **Issues**: [GitHub Issues](https://github.com/Abhishek131005/Mealloop/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Abhishek131005/Mealloop/discussions)
- **Email**: 2023.abhishek.vishwakarma@ves.ac.in

---

## 🎯 Production Deployment Checklist

Before deploying to production, ensure:

- [ ] **Environment Setup**
  - [ ] Production `.env` file configured
  - [ ] MongoDB Atlas cluster created
  - [ ] Cloudinary account set up
  - [ ] Google Maps API key obtained
  - [ ] Domain name configured

- [ ] **Security Configuration**
  - [ ] SSL certificates installed
  - [ ] Firewall rules configured
  - [ ] Strong passwords set
  - [ ] Security headers enabled

- [ ] **Monitoring Setup**
  - [ ] Health check endpoints working
  - [ ] Log aggregation configured
  - [ ] Monitoring alerts set up
  - [ ] Backup strategy implemented

- [ ] **CI/CD Configuration**
  - [ ] GitHub secrets configured
  - [ ] Automated deployment tested
  - [ ] Rollback procedure documented

- [ ] **Performance Optimization**
  - [ ] Resource limits set
  - [ ] Caching configured
  - [ ] CDN set up (if needed)
  - [ ] Database indexes optimized

Ready to revolutionize food donation with containerized deployment! 🚀🍽️