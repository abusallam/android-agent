#!/bin/bash
# TacticalOps Platform - MinIO Backup Script
# Backs up MinIO buckets and metadata to local storage and optionally to remote storage

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="/backups/minio"
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="$BACKUP_DIR/$TIMESTAMP"

# MinIO Configuration
MINIO_ENDPOINT="http://tacticalops-minio:9000"
MINIO_ACCESS_KEY=${MINIO_ROOT_USER:-tacticalops}
MINIO_SECRET_KEY=${MINIO_ROOT_PASSWORD}
MINIO_ALIAS="backup-minio"

# Buckets to backup
BUCKETS=(
    "${STORAGE_BUCKET_UPLOADS:-tacticalops-uploads}"
    "${STORAGE_BUCKET_MAPS:-tacticalops-maps}"
    "${STORAGE_BUCKET_MEDIA:-tacticalops-media}"
    "${STORAGE_BUCKET_LOGS:-tacticalops-logs}"
)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" >&2
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] SUCCESS: $1${NC}"
}

# Function to check if MinIO client is available
check_minio_client() {
    if ! command -v mc >/dev/null 2>&1; then
        error "MinIO client (mc) is not installed"
        return 1
    fi
    
    # Configure MinIO client
    mc alias set "$MINIO_ALIAS" "$MINIO_ENDPOINT" "$MINIO_ACCESS_KEY" "$MINIO_SECRET_KEY" >/dev/null 2>&1
    
    if ! mc admin info "$MINIO_ALIAS" >/dev/null 2>&1; then
        error "Cannot connect to MinIO server at $MINIO_ENDPOINT"
        return 1
    fi
    
    log "MinIO client configured successfully"
    return 0
}

# Function to create backup directory
create_backup_directory() {
    if ! mkdir -p "$BACKUP_PATH"; then
        error "Failed to create backup directory: $BACKUP_PATH"
        return 1
    fi
    
    log "Created backup directory: $BACKUP_PATH"
    return 0
}

# Function to backup a single bucket
backup_bucket() {
    local bucket_name="$1"
    local bucket_backup_path="$BACKUP_PATH/$bucket_name"
    
    log "Starting backup of bucket: $bucket_name"
    
    # Check if bucket exists
    if ! mc ls "$MINIO_ALIAS/$bucket_name" >/dev/null 2>&1; then
        warn "Bucket $bucket_name does not exist, skipping"
        return 0
    fi
    
    # Create bucket backup directory
    if ! mkdir -p "$bucket_backup_path"; then
        error "Failed to create bucket backup directory: $bucket_backup_path"
        return 1
    fi
    
    # Get bucket statistics
    local object_count
    local total_size
    object_count=$(mc ls --recursive "$MINIO_ALIAS/$bucket_name" 2>/dev/null | wc -l || echo "0")
    total_size=$(mc du "$MINIO_ALIAS/$bucket_name" 2>/dev/null | awk '{print $1}' || echo "0")
    
    log "Bucket $bucket_name: $object_count objects, $total_size bytes"
    
    # Backup bucket contents
    if mc mirror "$MINIO_ALIAS/$bucket_name" "$bucket_backup_path" --overwrite; then
        success "Successfully backed up bucket: $bucket_name"
        
        # Create bucket metadata file
        cat > "$bucket_backup_path/.backup-metadata.json" << EOF
{
    "bucket_name": "$bucket_name",
    "backup_timestamp": "$(date -Iseconds)",
    "object_count": $object_count,
    "total_size_bytes": $total_size,
    "backup_path": "$bucket_backup_path",
    "minio_endpoint": "$MINIO_ENDPOINT"
}
EOF
        
        return 0
    else
        error "Failed to backup bucket: $bucket_name"
        return 1
    fi
}

# Function to backup MinIO configuration
backup_minio_config() {
    local config_backup_path="$BACKUP_PATH/minio-config"
    
    log "Backing up MinIO configuration"
    
    if ! mkdir -p "$config_backup_path"; then
        error "Failed to create config backup directory"
        return 1
    fi
    
    # Export MinIO configuration
    if mc admin config export "$MINIO_ALIAS" > "$config_backup_path/config.json" 2>/dev/null; then
        success "MinIO configuration backed up"
    else
        warn "Failed to backup MinIO configuration (may not have admin permissions)"
    fi
    
    # Export bucket policies
    for bucket in "${BUCKETS[@]}"; do
        if mc ls "$MINIO_ALIAS/$bucket" >/dev/null 2>&1; then
            if mc policy get "$MINIO_ALIAS/$bucket" > "$config_backup_path/${bucket}-policy.json" 2>/dev/null; then
                log "Backed up policy for bucket: $bucket"
            else
                warn "Failed to backup policy for bucket: $bucket"
            fi
        fi
    done
    
    return 0
}

# Function to create backup manifest
create_backup_manifest() {
    local manifest_file="$BACKUP_PATH/backup-manifest.json"
    local backup_size
    local bucket_count
    
    backup_size=$(du -sb "$BACKUP_PATH" 2>/dev/null | cut -f1 || echo "0")
    bucket_count=${#BUCKETS[@]}
    
    cat > "$manifest_file" << EOF
{
    "backup_info": {
        "timestamp": "$(date -Iseconds)",
        "backup_path": "$BACKUP_PATH",
        "backup_size_bytes": $backup_size,
        "retention_days": $RETENTION_DAYS
    },
    "minio_info": {
        "endpoint": "$MINIO_ENDPOINT",
        "access_key": "$MINIO_ACCESS_KEY",
        "server_info": $(mc admin info "$MINIO_ALIAS" --json 2>/dev/null || echo '{}')
    },
    "buckets": [
$(for bucket in "${BUCKETS[@]}"; do
    if [[ -f "$BACKUP_PATH/$bucket/.backup-metadata.json" ]]; then
        cat "$BACKUP_PATH/$bucket/.backup-metadata.json"
        if [[ "$bucket" != "${BUCKETS[-1]}" ]]; then
            echo ","
        fi
    fi
done)
    ],
    "backup_status": "completed",
    "backup_script_version": "2.0.0"
}
EOF
    
    success "Backup manifest created: $manifest_file"
    return 0
}

# Function to compress backup
compress_backup() {
    local compressed_file="$BACKUP_DIR/minio-backup-$TIMESTAMP.tar.gz"
    
    log "Compressing backup..."
    
    if tar -czf "$compressed_file" -C "$BACKUP_DIR" "$TIMESTAMP"; then
        success "Backup compressed: $compressed_file"
        
        # Remove uncompressed backup directory
        rm -rf "$BACKUP_PATH"
        
        # Update backup path to compressed file
        BACKUP_PATH="$compressed_file"
        
        return 0
    else
        error "Failed to compress backup"
        return 1
    fi
}

# Function to clean old backups
cleanup_old_backups() {
    log "Cleaning up backups older than $RETENTION_DAYS days"
    
    # Find and remove old backup directories
    find "$BACKUP_DIR" -maxdepth 1 -type d -name "20*" -mtime +$RETENTION_DAYS -exec rm -rf {} \; 2>/dev/null || true
    
    # Find and remove old compressed backups
    find "$BACKUP_DIR" -maxdepth 1 -name "minio-backup-*.tar.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
    
    local remaining_backups
    remaining_backups=$(find "$BACKUP_DIR" -maxdepth 1 \( -type d -name "20*" -o -name "minio-backup-*.tar.gz" \) | wc -l)
    
    log "Cleanup completed. $remaining_backups backups remaining"
    return 0
}

# Function to verify backup integrity
verify_backup() {
    log "Verifying backup integrity..."
    
    local verification_failed=false
    
    # Check if backup manifest exists
    if [[ -f "$BACKUP_PATH/backup-manifest.json" ]]; then
        log "Backup manifest found"
    else
        error "Backup manifest not found"
        verification_failed=true
    fi
    
    # Verify each bucket backup
    for bucket in "${BUCKETS[@]}"; do
        local bucket_backup_path="$BACKUP_PATH/$bucket"
        
        if [[ -d "$bucket_backup_path" ]]; then
            local backup_object_count
            backup_object_count=$(find "$bucket_backup_path" -type f ! -name ".backup-metadata.json" | wc -l)
            log "Bucket $bucket backup contains $backup_object_count objects"
        else
            warn "Bucket backup directory not found: $bucket_backup_path"
        fi
    done
    
    if [[ "$verification_failed" == "true" ]]; then
        error "Backup verification failed"
        return 1
    else
        success "Backup verification completed successfully"
        return 0
    fi
}

# Function to send backup notification
send_notification() {
    local status="$1"
    local message="$2"
    
    # Log notification (can be extended to send emails, webhooks, etc.)
    if [[ "$status" == "success" ]]; then
        success "BACKUP NOTIFICATION: $message"
    else
        error "BACKUP NOTIFICATION: $message"
    fi
    
    # TODO: Implement email/webhook notifications
    # Example: curl -X POST webhook_url -d "{'status': '$status', 'message': '$message'}"
}

# Main backup function
main() {
    log "Starting MinIO backup process"
    log "=============================="
    log "Timestamp: $TIMESTAMP"
    log "Backup Directory: $BACKUP_PATH"
    log "Retention Days: $RETENTION_DAYS"
    log "Buckets to backup: ${BUCKETS[*]}"
    
    # Check prerequisites
    if ! check_minio_client; then
        send_notification "error" "MinIO backup failed: MinIO client not available"
        exit 1
    fi
    
    # Create backup directory
    if ! create_backup_directory; then
        send_notification "error" "MinIO backup failed: Cannot create backup directory"
        exit 1
    fi
    
    # Backup each bucket
    local failed_buckets=0
    for bucket in "${BUCKETS[@]}"; do
        if ! backup_bucket "$bucket"; then
            ((failed_buckets++))
        fi
    done
    
    # Backup MinIO configuration
    backup_minio_config
    
    # Create backup manifest
    if ! create_backup_manifest; then
        send_notification "error" "MinIO backup failed: Cannot create backup manifest"
        exit 1
    fi
    
    # Verify backup
    if ! verify_backup; then
        send_notification "error" "MinIO backup failed: Backup verification failed"
        exit 1
    fi
    
    # Compress backup
    if ! compress_backup; then
        warn "Failed to compress backup, keeping uncompressed version"
    fi
    
    # Clean up old backups
    cleanup_old_backups
    
    # Final status
    if [[ $failed_buckets -eq 0 ]]; then
        local backup_size
        if [[ -f "$BACKUP_PATH" ]]; then
            backup_size=$(du -h "$BACKUP_PATH" | cut -f1)
        else
            backup_size=$(du -sh "$BACKUP_PATH" | cut -f1)
        fi
        
        success "MinIO backup completed successfully!"
        log "Backup size: $backup_size"
        log "Failed buckets: $failed_buckets"
        
        send_notification "success" "MinIO backup completed successfully. Size: $backup_size, Failed buckets: $failed_buckets"
    else
        error "MinIO backup completed with errors!"
        log "Failed buckets: $failed_buckets"
        
        send_notification "error" "MinIO backup completed with errors. Failed buckets: $failed_buckets"
        exit 1
    fi
}

# Execute main function
main "$@"