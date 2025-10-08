# MealLoop Docker Development Helper - PowerShell Version
# Usage: .\scripts\docker-dev.ps1 [command]

param(
    [Parameter(Position=0)]
    [string]$Command = "help"
)

$PROJECT_NAME = "mealloop"
$COMPOSE_FILE = "docker-compose.dev.yml"

# Helper functions
function Write-Info($message) {
    Write-Host "[INFO] $message" -ForegroundColor Blue
}

function Write-Success($message) {
    Write-Host "[SUCCESS] $message" -ForegroundColor Green
}

function Write-Warning($message) {
    Write-Host "[WARNING] $message" -ForegroundColor Yellow
}

function Write-Error($message) {
    Write-Host "[ERROR] $message" -ForegroundColor Red
}

# Check if .env file exists
function Test-Environment {
    if (-not (Test-Path ".env")) {
        Write-Warning ".env file not found. Creating from .env.example..."
        if (Test-Path ".env.example") {
            Copy-Item ".env.example" ".env"
            Write-Info "Please update .env with your actual values before continuing"
            exit 1
        } else {
            Write-Error ".env.example not found. Please create .env file manually."
            exit 1
        }
    }
}

# Build all services
function Build-Services {
    Write-Info "Building all Docker images..."
    docker-compose -f $COMPOSE_FILE build --no-cache
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Build completed!"
    } else {
        Write-Error "Build failed!"
        exit 1
    }
}

# Start all services
function Start-Services {
    Test-Environment
    Write-Info "Starting MealLoop development environment..."
    docker-compose -f $COMPOSE_FILE up -d
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Services started!"
        Show-Status
    } else {
        Write-Error "Failed to start services!"
        exit 1
    }
}

# Start with logs
function Start-ServicesWithLogs {
    Test-Environment
    Write-Info "Starting MealLoop development environment with logs..."
    docker-compose -f $COMPOSE_FILE up
}

# Stop all services
function Stop-Services {
    Write-Info "Stopping all services..."
    docker-compose -f $COMPOSE_FILE down
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Services stopped!"
    } else {
        Write-Error "Failed to stop services!"
    }
}

# Restart all services
function Restart-Services {
    Write-Info "Restarting all services..."
    Stop-Services
    Start-Services
}

# Show logs
function Show-Logs {
    docker-compose -f $COMPOSE_FILE logs -f --tail=100
}

# Show status
function Show-Status {
    Write-Info "Service status:"
    docker-compose -f $COMPOSE_FILE ps
    Write-Host ""
    Write-Info "Health checks:"
    Write-Host "Frontend: http://localhost:3000"
    Write-Host "Backend: http://localhost:5000"
    Write-Host "Backend Health: http://localhost:5000/api/health"
    Write-Host "MongoDB: localhost:27017"
    Write-Host "Redis: localhost:6379"
}

# Clean up
function Clean-Resources {
    $response = Read-Host "This will remove all containers, images, and volumes. Are you sure? (y/N)"
    if ($response -match "^[yY]") {
        Write-Info "Cleaning up Docker resources..."
        docker-compose -f $COMPOSE_FILE down -v --rmi all
        docker system prune -f
        Write-Success "Cleanup completed!"
    } else {
        Write-Info "Cleanup cancelled."
    }
}

# Database operations
function Reset-Database {
    $response = Read-Host "This will reset the database. Are you sure? (y/N)"
    if ($response -match "^[yY]") {
        Write-Info "Resetting database..."
        docker-compose -f $COMPOSE_FILE exec mongodb mongosh --eval "db.dropDatabase()" mealloop_dev
        Write-Success "Database reset completed!"
    } else {
        Write-Info "Database reset cancelled."
    }
}

# Show help
function Show-Help {
    Write-Host "MealLoop Docker Development Helper - PowerShell"
    Write-Host ""
    Write-Host "Usage: .\scripts\docker-dev.ps1 [command]"
    Write-Host ""
    Write-Host "Commands:"
    Write-Host "  build      Build all Docker images"
    Write-Host "  up         Start all services in background"
    Write-Host "  up-logs    Start all services with logs"
    Write-Host "  down       Stop all services"
    Write-Host "  restart    Restart all services"
    Write-Host "  logs       Show service logs"
    Write-Host "  status     Show service status and URLs"
    Write-Host "  clean      Clean up all Docker resources"
    Write-Host "  db-reset   Reset database"
    Write-Host "  help       Show this help message"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\scripts\docker-dev.ps1 up        # Start development environment"
    Write-Host "  .\scripts\docker-dev.ps1 logs      # View logs"
    Write-Host "  .\scripts\docker-dev.ps1 status    # Check service status"
    Write-Host "  .\scripts\docker-dev.ps1 clean     # Clean up everything"
}

# Main command handling
switch ($Command.ToLower()) {
    "build" { Build-Services }
    "up" { Start-Services }
    "up-logs" { Start-ServicesWithLogs }
    "down" { Stop-Services }
    "restart" { Restart-Services }
    "logs" { Show-Logs }
    "status" { Show-Status }
    "clean" { Clean-Resources }
    "db-reset" { Reset-Database }
    default { Show-Help }
}