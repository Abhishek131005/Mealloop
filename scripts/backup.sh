#!/bin/bash

# MealLoop Backup Script
# Creates backups of database and uploaded files

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Create backup
backup() {
    local backup_date=$(date +%Y%m%d_%H%M%S)
    local backup_dir="backups/${backup_date}"
    
    log_info "💾 Starting backup process..."
    
    # Create backup directory
    mkdir -p "$backup_dir"
    
    # Backup MongoDB
    log_info "📦 Backing up MongoDB..."
    docker exec mealloop-mongo-prod mongodump --out /tmp/backup
    docker cp mealloop-mongo-prod:/tmp/backup "$backup_dir/mongodb"
    log_success "MongoDB backup completed"
    
    # Backup uploaded files
    log_info "📁 Backing up uploaded files..."
    docker cp mealloop-backend-prod:/app/public/uploads "$backup_dir/uploads"
    log_success "File backup completed"
    
    # Create compressed archive
    log_info "🗜️ Creating compressed archive..."
    tar -czf "${backup_dir}.tar.gz" "$backup_dir"
    rm -rf "$backup_dir"
    log_success "Backup completed: ${backup_dir}.tar.gz"
    
    # Clean old backups (keep last 7 days)
    log_info "🧹 Cleaning old backups..."
    find backups/ -name "*.tar.gz" -mtime +7 -delete
    log_success "Old backups cleaned"
}

# Restore backup
restore() {
    local backup_file="$1"
    
    if [ -z "$backup_file" ]; then
        echo "Usage: $0 restore <backup_file.tar.gz>"
        exit 1
    fi
    
    if [ ! -f "$backup_file" ]; then
        echo "Backup file not found: $backup_file"
        exit 1
    fi
    
    log_info "♻️  Restoring from backup: $backup_file"
    
    # Extract backup
    local temp_dir=$(mktemp -d)
    tar -xzf "$backup_file" -C "$temp_dir"
    local backup_name=$(basename "$backup_file" .tar.gz)
    local restore_dir="$temp_dir/$backup_name"
    
    # Restore MongoDB
    if [ -d "$restore_dir/mongodb" ]; then
        log_info "📦 Restoring MongoDB..."
        docker cp "$restore_dir/mongodb" mealloop-mongo-prod:/tmp/restore
        docker exec mealloop-mongo-prod mongorestore --drop /tmp/restore
        log_success "MongoDB restored"
    fi
    
    # Restore files
    if [ -d "$restore_dir/uploads" ]; then
        log_info "📁 Restoring uploaded files..."
        docker cp "$restore_dir/uploads" mealloop-backend-prod:/app/public/
        log_success "Files restored"
    fi
    
    # Cleanup
    rm -rf "$temp_dir"
    log_success "Restore completed"
}

# List backups
list_backups() {
    log_info "📋 Available backups:"
    ls -la backups/*.tar.gz 2>/dev/null || echo "No backups found"
}

# Main script
case "${1:-backup}" in
    backup)
        backup
        ;;
    restore)
        restore "$2"
        ;;
    list)
        list_backups
        ;;
    *)
        echo "Usage: $0 [backup|restore|list]"
        echo ""
        echo "Commands:"
        echo "  backup                    - Create new backup"
        echo "  restore <backup_file>     - Restore from backup"
        echo "  list                      - List available backups"
        exit 1
        ;;
esac