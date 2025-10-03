# MealLoop Deployment Guide

This guide covers both **Experiment 9** (CI/CD with GitHub Actions + Render/Vercel) and **Experiment 10** (Docker DevOps deployment).

## 📋 Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ installed
- Git installed
- GitHub account
- Render account (for backend)
- Vercel account (for frontend)

## 🚀 Experiment 9: CI/CD Deployment with GitHub Actions + Render/Vercel

### Step 1: Repository Setup

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Add CI/CD and Docker configuration"
   git push origin main
   ```

### Step 2: GitHub Secrets Configuration

Go to your GitHub repository → Settings → Secrets and Variables → Actions, and add:

**For CI/CD Pipeline:**
- `MONGO_URI_TEST`: Your test MongoDB connection string
- `JWT_SECRET`: Your JWT secret key
- `VITE_API_BASE_URL`: Your backend URL

**For Render Deployment:**
- `RENDER_SERVICE_ID`: Your Render service ID
- `RENDER_API_KEY`: Your Render API key

**For Vercel Deployment:**
- `VERCEL_TOKEN`: Your Vercel API token
- `VERCEL_ORG_ID`: Your Vercel organization ID
- `VERCEL_PROJECT_ID`: Your Vercel project ID

### Step 3: Backend Deployment on Render

1. **Create a new Web Service on Render:**
   - Connect your GitHub repository
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`

2. **Set Environment Variables on Render:**
   ```
   NODE_ENV=production
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   FRONTEND_URL=https://your-frontend.vercel.app
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_key
   CLOUDINARY_API_SECRET=your_cloudinary_secret
   ```

### Step 4: Frontend Deployment on Vercel

1. **Create a new project on Vercel:**
   - Import your GitHub repository
   - Root Directory: `frontend/mealloop`
   - Framework Preset: Vite

2. **Set Environment Variables on Vercel:**
   ```
   VITE_API_BASE_URL=https://your-backend.render.com
   ```

### Step 5: Test Automatic Deployment

1. Make a change to your code
2. Push to the `main` branch
3. Watch the GitHub Actions workflow run
4. Verify deployments on Render and Vercel

---

## 🐳 Experiment 10: Docker DevOps Deployment

### Step 1: Environment Setup

1. **Copy environment files:**
   ```bash
   cp .env.example .env
   cp .env.prod.example .env.prod
   ```

2. **Update environment variables in `.env` and `.env.prod`**

### Step 2: Development Deployment

1. **Start development environment:**
   ```bash
   # Make scripts executable (Linux/Mac)
   chmod +x scripts/deploy.sh scripts/backup.sh

   # Deploy development environment
   ./scripts/deploy.sh dev
   
   # OR manually:
   docker-compose up --build -d
   ```

2. **Access your application:**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000
   - Backend Health: http://localhost:5000/health

### Step 3: Production Deployment

1. **Deploy production environment:**
   ```bash
   ./scripts/deploy.sh prod
   
   # OR manually:
   docker-compose -f docker-compose.prod.yml up --build -d
   ```

2. **Monitor deployment:**
   ```bash
   # View logs
   docker-compose -f docker-compose.prod.yml logs -f
   
   # Check container status
   docker-compose -f docker-compose.prod.yml ps
   ```

### Step 4: Database Management

1. **Create backup:**
   ```bash
   ./scripts/backup.sh backup
   ```

2. **List backups:**
   ```bash
   ./scripts/backup.sh list
   ```

3. **Restore from backup:**
   ```bash
   ./scripts/backup.sh restore backups/20231002_143000.tar.gz
   ```

### Step 5: Monitoring (Optional)

1. **Start monitoring stack:**
   ```bash
   docker-compose -f docker-compose.monitoring.yml up -d
   ```

2. **Access monitoring tools:**
   - Prometheus: http://localhost:9090
   - Grafana: http://localhost:3001 (admin/admin123)

## 🔧 Useful Commands

### Docker Management
```bash
# View all containers
docker ps -a

# View logs for specific service
docker logs mealloop-backend-prod

# Execute command in container
docker exec -it mealloop-backend-prod bash

# Remove all stopped containers
docker container prune

# Remove unused images
docker image prune

# Full system cleanup
docker system prune -a
```

### Database Operations
```bash
# Connect to MongoDB
docker exec -it mealloop-mongo-prod mongosh

# Export database
docker exec mealloop-mongo-prod mongodump --out /tmp/backup

# Import database
docker exec mealloop-mongo-prod mongorestore /tmp/backup
```

## 🛡️ Security Considerations

1. **Environment Variables:**
   - Never commit `.env` files to Git
   - Use strong passwords for production
   - Rotate secrets regularly

2. **Docker Security:**
   - Run containers as non-root users
   - Use official base images
   - Keep images updated
   - Scan for vulnerabilities

3. **Network Security:**
   - Use HTTPS in production
   - Configure proper CORS settings
   - Implement rate limiting

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use:**
   ```bash
   # Kill processes using ports
   sudo lsof -ti:3000 | xargs kill -9
   sudo lsof -ti:5000 | xargs kill -9
   ```

2. **Database connection issues:**
   - Check MongoDB container is running
   - Verify connection string format
   - Check network connectivity

3. **Frontend build issues:**
   - Clear node_modules and reinstall
   - Check environment variables
   - Verify API endpoints

4. **Memory issues:**
   ```bash
   # Increase Docker memory limit
   # Check Docker Desktop settings
   ```

## 📊 Monitoring and Logs

### Application Logs
```bash
# Backend logs
docker logs mealloop-backend-prod -f

# Frontend logs
docker logs mealloop-frontend-prod -f

# Database logs
docker logs mealloop-mongo-prod -f
```

### Performance Monitoring
- Use the monitoring stack for metrics
- Set up alerts for critical issues
- Monitor resource usage regularly

## 🎯 Success Criteria

### Experiment 9 (CI/CD):
- ✅ Automated testing on push/PR
- ✅ Automatic deployment to staging/production
- ✅ Backend deployed on Render
- ✅ Frontend deployed on Vercel
- ✅ Environment-specific configurations

### Experiment 10 (Docker DevOps):
- ✅ Multi-container application setup
- ✅ Development and production configurations
- ✅ Database persistence and backups
- ✅ Health checks and monitoring
- ✅ Automated deployment scripts
- ✅ Security best practices

## 🔗 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Docker](https://hub.docker.com/_/mongo)
- [Nginx Configuration](https://nginx.org/en/docs/)

---

**Congratulations! 🎉** You have successfully implemented both CI/CD deployment and Docker DevOps practices for your MealLoop application.