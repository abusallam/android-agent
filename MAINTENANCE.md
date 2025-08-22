# 🛠️ TacticalOps Platform Maintenance Guide

## Overview

This guide provides comprehensive procedures for maintaining, updating, and managing the TacticalOps platform. It covers routine maintenance tasks, system updates, backup procedures, and troubleshooting guidelines.

## Routine Maintenance

### Daily Tasks

- [ ] Check system health and performance metrics
- [ ] Review error logs and resolve critical issues
- [ ] Verify backup completion and integrity
- [ ] Monitor disk space and cleanup if needed
- [ ] Check SSL certificate expiration dates

### Weekly Tasks

- [ ] Run comprehensive system diagnostics
- [ ] Update dependencies and security patches
- [ ] Rotate logs and archive old entries
- [ ] Test disaster recovery procedures
- [ ] Review and optimize database performance

### Monthly Tasks

- [ ] Perform full system backup and restore test
- [ ] Audit user accounts and permissions
- [ ] Review security policies and compliance
- [ ] Update documentation and knowledge base
- [ ] Plan capacity upgrades if needed

## System Updates

### Update Procedures

#### Web Application (Next.js)

```bash
# Navigate to modern-dashboard directory
cd modern-dashboard

# Update dependencies
npm outdated
npm update

# Run tests
npm test

# Build and deploy
npm run build
npm run start
```

#### Mobile Application (React Native)

```bash
# Navigate to react-native-app directory
cd react-native-app

# Update dependencies
npm outdated
npm update

# Run tests
npm test

# Build APK
npm run build:apk
```

#### Database Schema Updates

```bash
# Navigate to modern-dashboard
cd modern-dashboard

# Generate migration
npx prisma migrate dev --name update_description

# Apply migration
npx prisma migrate deploy

# Update client
npx prisma generate
```

### Version Control

```bash
# Create backup branch
git checkout -b backup/$(date +%Y%m%d)

# Commit current state
git add .
git commit -m "Backup before update $(date +%Y%m%d)"

# Update main branch
git checkout main
git pull origin main

# Merge updates
git merge backup/$(date +%Y%m%d)
```

## Backup and Recovery

### Backup Strategy

```bash
# Daily backups
0 2 * * * /opt/tacticalops/scripts/backup-daily.sh

# Weekly full backups
0 3 * * 0 /opt/tacticalops/scripts/backup-weekly.sh

# Monthly archive backups
0 4 1 * * /opt/tacticalops/scripts/backup-monthly.sh
```

### Backup Scripts

#### Daily Backup Script

```bash
#!/bin/bash
# backup-daily.sh

DATE=$(date +%Y%m%d)
BACKUP_DIR="/opt/backups/daily"
LOG_FILE="/var/log/tacticalops/backup.log"

echo "$(date): Starting daily backup" >> $LOG_FILE

# Database backup
pg_dump tacticalops > $BACKUP_DIR/db-$DATE.sql
gzip $BACKUP_DIR/db-$DATE.sql

# Configuration backup
tar -czf $BACKUP_DIR/config-$DATE.tar.gz /opt/tacticalops/config/

# Application backup
tar -czf $BACKUP_DIR/app-$DATE.tar.gz /opt/tacticalops/app/

echo "$(date): Daily backup completed" >> $LOG_FILE
```

#### Weekly Backup Script

```bash
#!/bin/bash
# backup-weekly.sh

DATE=$(date +%Y%m%d)
BACKUP_DIR="/opt/backups/weekly"
LOG_FILE="/var/log/tacticalops/backup.log"

echo "$(date): Starting weekly backup" >> $LOG_FILE

# Full database backup
pg_dump -h localhost -U tacticalops tacticalops > $BACKUP_DIR/db-full-$DATE.sql
gzip $BACKUP_DIR/db-full-$DATE.sql

# Full system backup
tar -czf $BACKUP_DIR/system-$DATE.tar.gz /opt/tacticalops/

# Offsite backup sync
rsync -av $BACKUP_DIR/ user@backup-server:/backups/tacticalops/

echo "$(date): Weekly backup completed" >> $LOG_FILE
```

### Recovery Procedures

#### Database Recovery

```bash
# Stop application services
sudo systemctl stop tacticalops-web
sudo systemctl stop tacticalops-api

# Restore database
gunzip < /opt/backups/daily/db-20250815.sql.gz | psql tacticalops

# Start services
sudo systemctl start tacticalops-api
sudo systemctl start tacticalops-web
```

#### Full System Recovery

```bash
# Restore from weekly backup
sudo systemctl stop tacticalops-*
tar -xzf /opt/backups/weekly/system-20250815.tar.gz -C /

# Restore database
gunzip < /opt/backups/weekly/db-full-20250815.sql.gz | psql tacticalops

# Restart services
sudo systemctl start tacticalops-web
sudo systemctl start tacticalops-api
sudo systemctl start tacticalops-mcp
```

## Monitoring and Alerts

### System Monitoring

```bash
# Health check script
#!/bin/bash
# health-check.sh

# Check API health
curl -f http://localhost:3000/api/health || echo "API down"

# Check database connectivity
pg_isready -h localhost -U tacticalops || echo "Database down"

# Check disk space
df -h | awk '$5 > 80 {print "Disk usage warning: " $5}'

# Check memory usage
free | awk 'NR==2{printf "Memory usage: %s/%sMB (%.2f%%)\n", $3/1024, $2/1024, $3*100/$2 }'
```

### Alert Configuration

```bash
# Configure alerts in /etc/alertmanager/config.yml
route:
  group_by: ['alertname']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 1h
  receiver: 'tacticalops-team'

receivers:
- name: 'tacticalops-team'
  email_configs:
  - to: 'ops@tacticalops.com'
    send_resolved: true
  slack_configs:
  - api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'
    channel: '#alerts'
```

## Security Maintenance

### Security Updates

```bash
# Weekly security scan
0 4 * * 0 /opt/tacticalops/scripts/security-scan.sh

# Security scan script
#!/bin/bash
# security-scan.sh

# Update vulnerability database
sudo apt update
sudo apt install -y clamav
sudo freshclam

# Scan system
clamscan -r /opt/tacticalops/ --log=/var/log/clamav/scan-$(date +%Y%m%d).log

# Check for security updates
unattended-upgrades --dry-run
```

### Certificate Management

```bash
# Certificate renewal check
#!/bin/bash
# cert-check.sh

CERT_FILE="/etc/ssl/certs/tacticalops.crt"
EXPIRY_DATE=$(openssl x509 -in $CERT_FILE -noout -enddate | cut -d= -f2)
EXPIRY_SECONDS=$(date -d "$EXPIRY_DATE" +%s)
CURRENT_SECONDS=$(date +%s)
DAYS_REMAINING=$(( ($EXPIRY_SECONDS - $CURRENT_SECONDS) / 86400 ))

if [ $DAYS_REMAINING -lt 30 ]; then
    echo "Certificate expires in $DAYS_REMAINING days - renewal required"
    # Trigger renewal process
    sudo certbot renew
fi
```

## Performance Optimization

### Database Optimization

```sql
-- Regular maintenance queries
-- Update table statistics
ANALYZE;

-- Reindex tables
REINDEX TABLE tactical_profiles;
REINDEX TABLE tactical_sessions;
REINDEX TABLE tactical_map_features;

-- Vacuum database
VACUUM ANALYZE;
```

### Application Optimization

```bash
# Monitor and optimize Node.js processes
#!/bin/bash
# optimize-node.sh

# Check memory usage
ps aux | grep node | awk '{print $2, $4, $11}' | sort -k2 -nr | head -5

# Restart high-memory processes
for pid in $(ps aux | grep node | awk '$4 > 50 {print $2}'); do
    echo "Restarting high-memory process: $pid"
    kill -HUP $pid
done
```

## Troubleshooting

### Common Issues and Solutions

#### Service Not Starting

```bash
# Check service status
sudo systemctl status tacticalops-web

# Check logs
sudo journalctl -u tacticalops-web -f

# Common fixes
sudo systemctl daemon-reload
sudo systemctl reset-failed tacticalops-web
```

#### Database Connection Issues

```bash
# Check database service
sudo systemctl status postgresql

# Test connection
pg_isready -h localhost -U tacticalops

# Check configuration
cat /etc/postgresql/*/main/pg_hba.conf
```

#### Performance Degradation

```bash
# Monitor system resources
htop
iotop
nethogs

# Check application logs
tail -f /var/log/tacticalops/*.log

# Restart services
sudo systemctl restart tacticalops-web
```

### Diagnostic Commands

```bash
# System overview
uname -a
df -h
free -m
uptime

# Network connectivity
ping -c 4 google.com
netstat -tlnp | grep :3000
ss -tlnp | grep tacticalops

# Process monitoring
ps aux | grep tacticalops
top -p $(pgrep -d',' -f tacticalops)
```

## Disaster Recovery

### Recovery Plan

1. **Immediate Response**

   - Assess damage and impact
   - Activate backup systems
   - Notify stakeholders
   - Document incident details

2. **Recovery Steps**

   - Restore from latest backup
   - Verify system integrity
   - Test critical functions
   - Gradually restore services

3. **Post-Recovery**
   - Analyze root cause
   - Update documentation
   - Review and improve procedures
   - Conduct lessons learned session

### Emergency Contacts

- **Primary Administrator**: admin@tacticalops.com
- **Backup Administrator**: backup@tacticalops.com
- **Database Administrator**: dba@tacticalops.com
- **Security Officer**: security@tacticalops.com

## Documentation Updates

### When to Update Documentation

- After system updates or patches
- When new features are implemented
- Following security incidents
- After process improvements
- When team members change

### Documentation Review Schedule

- **Monthly**: Quick review of critical procedures
- **Quarterly**: Comprehensive documentation audit
- **Annually**: Full documentation overhaul

---

**Last Updated**: August 2025
**Version**: 2.0.0
**Next Review**: November 2025
