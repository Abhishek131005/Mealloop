#!/bin/bash

# MealLoop Production Deployment Script
# Usage: ./scripts/docker-prod.sh [command]

set -e

PROJECT_NAME="mealloop"
COMPOSE_FILE="docker-compose.prod.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env file exists and has production values
check_env() {
    if [ ! -f .env ]; then
        log_error ".env file not found. Please create one with production values."
        exit 1
    fi
    
    # Check for required production environment variables
    required_vars=("MONGODB_URI" "JWT_SECRET" "CLOUDINARY_CLOUD_NAME" "GOOGLE_MAPS_API_KEY")
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^${var}=" .env || grep -q "^${var}=$" .env || grep -q "^${var}=your-" .env; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        log_error "Missing or incomplete production environment variables:"
        printf '%s\n' "${missing_vars[@]}"
        exit 1
    fi
}

# Pre-deployment checks
pre_deploy_checks() {
    log_info "Running pre-deployment checks..."
    
    # Check Docker and Docker Compose
    if ! command -v docker &> /dev/null; then
        log_error "Docker not found. Please install Docker."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose not found. Please install Docker Compose."
        exit 1
    fi
    
    # Check environment
    check_env
    
    # Check if ports are available
    if netstat -tuln | grep -q ":80 "; then
        log_error "Port 80 is already in use. Please stop the service using it."
        exit 1
    fi
    
    log_success "Pre-deployment checks passed!"
}

# Build production images
build() {
    log_info "Building production Docker images..."
    docker-compose -f $COMPOSE_FILE build --no-cache
    log_success "Production images built successfully!"
}

# Deploy to production
deploy() {
    pre_deploy_checks
    
    log_info "Deploying MealLoop to production..."
    
    # Pull latest images if using registry
    docker-compose -f $COMPOSE_FILE pull || true
    
    # Start services
    docker-compose -f $COMPOSE_FILE up -d
    
    # Wait for services to be healthy
    log_info "Waiting for services to be healthy..."
    sleep 30
    
    # Check health
    health_check
    
    log_success "Production deployment completed!"
}

# Health check
health_check() {
    log_info "Checking service health..."
    
    # Check backend health
    if curl -f http://localhost/api/health > /dev/null 2>&1; then
        log_success "Backend is healthy"
    else
        log_error "Backend health check failed"
        return 1
    fi
    
    # Check frontend
    if curl -f http://localhost/health > /dev/null 2>&1; then
        log_success "Frontend is healthy"
    else
        log_error "Frontend health check failed"
        return 1
    fi
    
    log_success "All services are healthy!"
}

# Rolling update
update() {
    log_info "Performing rolling update..."
    
    # Pull latest images
    docker-compose -f $COMPOSE_FILE pull
    
    # Recreate services with zero downtime
    docker-compose -f $COMPOSE_FILE up -d --force-recreate --no-deps backend
    sleep 10
    docker-compose -f $COMPOSE_FILE up -d --force-recreate --no-deps frontend
    
    # Clean up old images
    docker image prune -f
    
    log_success "Rolling update completed!"
}

# Backup database
backup() {
    log_info "Creating database backup..."
    
    timestamp=$(date +%Y%m%d_%H%M%S)
    backup_file="backup_${timestamp}.gz"
    
    # This assumes you're using MongoDB Atlas or external DB
    # Adjust the command based on your database setup
    if grep -q "mongodb://" .env; then
        log_warning "Local MongoDB detected. Creating local backup..."
        docker-compose -f $COMPOSE_FILE exec -T mongodb mongodump --archive --gzip > $backup_file
    else
        log_info "External MongoDB detected. Please use your cloud provider's backup tools."
    fi
    
    log_success "Backup created: $backup_file"
}

# Show logs
logs() {
    docker-compose -f $COMPOSE_FILE logs -f --tail=100 "${2:-}"
}

# Show status
status() {
    log_info "Production service status:"
    docker-compose -f $COMPOSE_FILE ps
    echo ""
    log_info "Service URLs:"
    echo "Application: http://your-domain.com"
    echo "Health Check: http://your-domain.com/api/health"
    echo ""
    log_info "Resource usage:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
}

# Stop services
stop() {
    log_warning "This will stop all production services. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        log_info "Stopping production services..."
        docker-compose -f $COMPOSE_FILE down
        log_success "Services stopped!"
    else
        log_info "Stop cancelled."
    fi
}

# Cleanup
cleanup() {
    log_warning "This will remove stopped containers and unused images. Continue? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        log_info "Cleaning up..."
        docker system prune -f
        docker volume prune -f
        log_success "Cleanup completed!"
    else
        log_info "Cleanup cancelled."
    fi
}

# Show help
help() {
    echo "MealLoop Production Deployment Script"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  deploy     Deploy to production (includes pre-checks)"
    echo "  build      Build production images"
    echo "  update     Perform rolling update"
    echo "  health     Check service health"
    echo "  backup     Create database backup"
    echo "  logs       Show service logs"
    echo "  status     Show service status and resource usage"
    echo "  stop       Stop all services"
    echo "  cleanup    Clean up unused Docker resources"
    echo "  help       Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 deploy    # Full deployment with checks"
    echo "  $0 update    # Rolling update"
    echo "  $0 logs backend  # Show backend logs only"
    echo "  $0 status    # Check status and resources"
}

# Main command handling
case "${1:-help}" in
    deploy)
        deploy
        ;;
    build)
        build
        ;;
    update)
        update
        ;;
    health)
        health_check
        ;;
    backup)
        backup
        ;;
    logs)
        logs "$@"
        ;;
    status)
        status
        ;;
    stop)
        stop
        ;;
    cleanup)
        cleanup
        ;;
    help|*)
        help
        ;;
esac