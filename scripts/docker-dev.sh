#!/bin/bash

# MealLoop Docker Development Helper Scripts
# Usage: ./scripts/docker-dev.sh [command]

set -e

PROJECT_NAME="mealloop"
COMPOSE_FILE="docker-compose.dev.yml"

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

# Check if .env file exists
check_env() {
    if [ ! -f .env ]; then
        log_warning ".env file not found. Creating from .env.example..."
        if [ -f .env.example ]; then
            cp .env.example .env
            log_info "Please update .env with your actual values before continuing"
            exit 1
        else
            log_error ".env.example not found. Please create .env file manually."
            exit 1
        fi
    fi
}

# Build all services
build() {
    log_info "Building all Docker images..."
    docker-compose -f $COMPOSE_FILE build --no-cache
    log_success "Build completed!"
}

# Start all services
up() {
    check_env
    log_info "Starting MealLoop development environment..."
    docker-compose -f $COMPOSE_FILE up -d
    log_success "Services started!"
    logs
}

# Start with logs
up_logs() {
    check_env
    log_info "Starting MealLoop development environment with logs..."
    docker-compose -f $COMPOSE_FILE up
}

# Stop all services
down() {
    log_info "Stopping all services..."
    docker-compose -f $COMPOSE_FILE down
    log_success "Services stopped!"
}

# Restart all services
restart() {
    log_info "Restarting all services..."
    down
    up
}

# Show logs
logs() {
    docker-compose -f $COMPOSE_FILE logs -f --tail=100
}

# Show status
status() {
    log_info "Service status:"
    docker-compose -f $COMPOSE_FILE ps
    echo ""
    log_info "Health checks:"
    echo "Frontend: http://localhost:3000"
    echo "Backend: http://localhost:5000"
    echo "Backend Health: http://localhost:5000/api/health"
    echo "MongoDB: localhost:27017"
    echo "Redis: localhost:6379"
}

# Clean up
clean() {
    log_warning "This will remove all containers, images, and volumes. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        log_info "Cleaning up Docker resources..."
        docker-compose -f $COMPOSE_FILE down -v --rmi all
        docker system prune -f
        log_success "Cleanup completed!"
    else
        log_info "Cleanup cancelled."
    fi
}

# Database operations
db_reset() {
    log_warning "This will reset the database. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        log_info "Resetting database..."
        docker-compose -f $COMPOSE_FILE exec mongodb mongosh --eval "db.dropDatabase()" mealloop_dev
        log_success "Database reset completed!"
    else
        log_info "Database reset cancelled."
    fi
}

# Show help
help() {
    echo "MealLoop Docker Development Helper"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  build      Build all Docker images"
    echo "  up         Start all services in background"
    echo "  up-logs    Start all services with logs"
    echo "  down       Stop all services"
    echo "  restart    Restart all services"
    echo "  logs       Show service logs"
    echo "  status     Show service status and URLs"
    echo "  clean      Clean up all Docker resources"
    echo "  db-reset   Reset database"
    echo "  help       Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 up        # Start development environment"
    echo "  $0 logs      # View logs"
    echo "  $0 status    # Check service status"
    echo "  $0 clean     # Clean up everything"
}

# Main command handling
case "${1:-help}" in
    build)
        build
        ;;
    up)
        up
        ;;
    up-logs)
        up_logs
        ;;
    down)
        down
        ;;
    restart)
        restart
        ;;
    logs)
        logs
        ;;
    status)
        status
        ;;
    clean)
        clean
        ;;
    db-reset)
        db_reset
        ;;
    help|*)
        help
        ;;
esac