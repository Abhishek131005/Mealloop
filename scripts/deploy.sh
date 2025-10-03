#!/bin/bash

# MealLoop Deployment Script
# This script handles the complete deployment process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Main deployment function
deploy() {
    log_info "🚀 Starting MealLoop deployment process..."
    
    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    log_success "Docker is running"
    
    # Load environment variables
    if [ -f .env.prod ]; then
        log_info "Loading production environment variables..."
        export $(cat .env.prod | grep -v '#' | awk '/=/ {print $1}')
        log_success "Environment variables loaded"
    else
        log_warning "No .env.prod file found. Using default values."
    fi
    
    # Create necessary directories
    log_info "Creating necessary directories..."
    mkdir -p nginx/ssl
    mkdir -p logs
    mkdir -p backups
    log_success "Directories created"
    
    # Build containers
    log_info "📦 Building Docker containers..."
    docker-compose -f docker-compose.prod.yml build --no-cache
    log_success "Containers built successfully"
    
    # Stop existing containers
    log_info "🔄 Stopping existing containers..."
    docker-compose -f docker-compose.prod.yml down --remove-orphans
    log_success "Existing containers stopped"
    
    # Start new containers
    log_info "🚀 Starting new containers..."
    docker-compose -f docker-compose.prod.yml up -d
    log_success "Containers started"
    
    # Wait for services to be ready
    log_info "⏳ Waiting for services to be ready..."
    sleep 30
    
    # Health checks
    log_info "🔍 Performing health checks..."
    
    # Backend health check
    max_attempts=30
    attempt=1
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:5000/health > /dev/null 2>&1; then
            log_success "Backend is healthy"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            log_error "Backend health check failed after $max_attempts attempts"
            log_info "Checking backend logs..."
            docker logs mealloop-backend-prod --tail 20
            exit 1
        fi
        
        log_info "Attempt $attempt/$max_attempts: Backend not ready, waiting..."
        sleep 10
        ((attempt++))
    done
    
    # Frontend health check
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        log_success "Frontend is healthy"
    else
        log_error "Frontend health check failed"
        log_info "Checking frontend logs..."
        docker logs mealloop-frontend-prod --tail 20
        exit 1
    fi
    
    # Show running containers
    log_info "📊 Current container status:"
    docker-compose -f docker-compose.prod.yml ps
    
    # Show application URLs
    log_success "🎉 Deployment completed successfully!"
    echo ""
    log_info "Application URLs:"
    echo "📱 Frontend: http://localhost:3000"
    echo "🔧 Backend:  http://localhost:5000"
    echo "🔍 Health:   http://localhost:5000/health"
    echo ""
    log_info "To view logs: docker-compose -f docker-compose.prod.yml logs -f"
    log_info "To stop:      docker-compose -f docker-compose.prod.yml down"
}

# Development deployment
deploy_dev() {
    log_info "🛠️  Starting development deployment..."
    
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    
    # Load dev environment
    if [ -f .env ]; then
        export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
    fi
    
    log_info "📦 Building and starting development containers..."
    docker-compose up --build -d
    
    log_info "⏳ Waiting for services..."
    sleep 20
    
    # Health checks
    if curl -f http://localhost:5000/health > /dev/null 2>&1; then
        log_success "Backend is healthy"
    else
        log_warning "Backend health check failed"
    fi
    
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        log_success "Frontend is healthy"
    else
        log_warning "Frontend health check failed"
    fi
    
    log_success "🎉 Development environment is ready!"
    echo "📱 Frontend: http://localhost:3000"
    echo "🔧 Backend:  http://localhost:5000"
}

# Show usage
usage() {
    echo "Usage: $0 [dev|prod]"
    echo ""
    echo "Commands:"
    echo "  dev   - Deploy development environment"
    echo "  prod  - Deploy production environment (default)"
    echo ""
    echo "Examples:"
    echo "  $0           # Deploy production"
    echo "  $0 prod      # Deploy production"
    echo "  $0 dev       # Deploy development"
}

# Main script logic
case "${1:-prod}" in
    dev)
        deploy_dev
        ;;
    prod)
        deploy
        ;;
    *)
        usage
        exit 1
        ;;
esac