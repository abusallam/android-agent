# 🚀 TacticalOps Platform Deployment Guide

## Overview

This comprehensive deployment guide covers all aspects of deploying the TacticalOps Platform across different environments and tiers. The platform supports multiple deployment scenarios from development to production-grade military installations.

## 🎯 Deployment Tiers

### 🌍 Civilian Tier (Open Source)
- **Target**: Emergency responders, NGOs, community organizations
- **Deployment**: Docker Compose, single-server setup
- **Security**: Standard TLS, basic authentication
- **Scalability**: Up to 100 concurrent users
- **Cost**: Free and open source

### 🏛️ Government Tier (Commercial)
- **Target**: Government agencies, law enforcement, public safety
- **Deployment**: Kubernetes, multi-server cluster
- **Security**: Enhanced encryption, MFA, audit logging
- **Scalability**: Up to 500 concurrent users
- **Cost**: Commercial licensing required

### 🎖️ Military Tier (Enterprise)
- **Target**: Military, defense contractors, classified operations
- **Deployment**: Air-gapped, hardened infrastructure
- **Security**: Military-grade encryption, PKI, classification management
- **Scalability**: Up to 1000+ concurrent users
- **Cost**: Enterprise licensing and support

## 🛠️ Prerequisites

### System Requirements

#### Minimum Requirements (Civilian Tier)
- **OS**: Linux (Ubuntu 20.04+, Debian 11+, CentOS 8+)
- **CPU**: 2 cores, 2.4 GHz
- **RAM**: 4 GB
- **Storage**: 50 GB SSD
- **Network**: 10 Mbps internet connection

#### Recommended Requirements (Government/Military Tier)
- **OS**: Linux (Debian 12, RHEL 9, Ubuntu 22.04 LTS)
- **CPU**: 8 cores, 3.0 GHz
- **RAM**: 16 GB
- **Storage**: 200 GB NVMe SSD
- **Network**: 100 Mbps dedicated connection

#### High Availability Setup
- **Load Balancer**: 2x servers (HAProxy/Nginx)
- **Application Servers**: 3x servers (active-active-standby)
- **Database Cluster**: 3x servers (PostgreSQL cluster)
- **Storage**: Shared storage or distributed filesystem

### Software Dependencies
```bash
# Core dependencies
- Docker 24.0+
- Docker Compose 2.20+
- Node.js 20+ (for development)
- PostgreSQL 15+
- Redis 7+
- Nginx 1.24+

# Security dependencies
- OpenSSL 3.0+
- libsodium 1.0.18+
- certbot (for SSL certificates)

# Monitoring dependencies
- Prometheus 2.40+
- Grafana 10.0+
- Loki 2.8+ (optional)
```

## 🐳 Docker Deployment

### Quick Start (Civilian Tier)
```bash
# Clone repository
git clone https://github.com/tacticalops/platform.git
cd platform

# Copy environment configuration
cp .env.example .env
# Edit .env with your settings

# Start all services
docker-compose up -d

# Verify deployment
curl http://localhost:3000/api/v2/health

# Access the platform
# Web: http://localhost:3000
# API: http://localhost:3000/api/v2
```

### Production Docker Setup
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  nginx:
    image: nginx:1.24-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/ssl/certs:ro
      - ./logs/nginx:/var/log/nginx
    depends_on:
      - tacticalops-app
    restart: unless-stopped

  tacticalops-app:
    image: tacticalops/platform:latest
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@postgres:5432/tacticalops
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
    volumes:
      - ./uploads:/app/uploads
      - ./logs/app:/app/logs
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/v2/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=tacticalops
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana:/etc/grafana/provisioning
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  prometheus_data:
  grafana_data:

networks:
  default:
    driver: bridge
```

### Environment Configuration
```bash
# .env.production
NODE_ENV=production
PORT=3000

# Database Configuration
DATABASE_URL=postgresql://tacticalops:secure_password@postgres:5432/tacticalops
DB_USER=tacticalops
DB_PASSWORD=secure_database_password

# Redis Configuration
REDIS_URL=redis://:secure_redis_password@redis:6379
REDIS_PASSWORD=secure_redis_password

# Security Configuration
JWT_SECRET=your_super_secure_jwt_secret_key_here
ENCRYPTION_KEY=your_32_byte_encryption_key_here
SESSION_SECRET=your_session_secret_here

# API Configuration
API_VERSION=v2
RATE_LIMIT_REQUESTS=1000
RATE_LIMIT_WINDOW=3600

# Monitoring Configuration
PROMETHEUS_ENABLED=true
GRAFANA_PASSWORD=secure_grafana_password

# Tier Configuration
DEPLOYMENT_TIER=civilian
FEATURES_ENABLED=basic,mapping,emergency,communication

# SSL Configuration
SSL_ENABLED=true
SSL_CERT_PATH=/etc/ssl/certs/tacticalops.crt
SSL_KEY_PATH=/etc/ssl/private/tacticalops.key

# Backup Configuration
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30
```

## ☸️ Kubernetes Deployment

### Government Tier Kubernetes Setup
```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: tacticalops
  labels:
    name: tacticalops
    tier: government

---
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: tacticalops-config
  namespace: tacticalops
data:
  NODE_ENV: "production"
  API_VERSION: "v2"
  DEPLOYMENT_TIER: "government"
  FEATURES_ENABLED: "enhanced,mapping,emergency,communication,analytics,compliance"

---
# k8s/secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: tacticalops-secrets
  namespace: tacticalops
type: Opaque
stringData:
  DATABASE_URL: "postgresql://tacticalops:secure_password@postgres:5432/tacticalops"
  REDIS_URL: "redis://:secure_password@redis:6379"
  JWT_SECRET: "your_super_secure_jwt_secret"
  ENCRYPTION_KEY: "your_32_byte_encryption_key"

---
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tacticalops-app
  namespace: tacticalops
spec:
  replicas: 3
  selector:
    matchLabels:
      app: tacticalops-app
  template:
    metadata:
      labels:
        app: tacticalops-app
    spec:
      containers:
      - name: tacticalops
        image: tacticalops/platform:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          valueFrom:
            configMapKeyRef:
              name: tacticalops-config
              key: NODE_ENV
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: tacticalops-secrets
              key: DATABASE_URL
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: tacticalops-secrets
              key: REDIS_URL
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/v2/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/v2/ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5

---
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: tacticalops-service
  namespace: tacticalops
spec:
  selector:
    app: tacticalops-app
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: ClusterIP

---
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: tacticalops-ingress
  namespace: tacticalops
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - tacticalops.yourdomain.com
    secretName: tacticalops-tls
  rules:
  - host: tacticalops.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: tacticalops-service
            port:
              number: 80

---
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: tacticalops-hpa
  namespace: tacticalops
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: tacticalops-app
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Kubernetes Deployment Commands
```bash
# Create namespace and deploy
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa.yaml

# Verify deployment
kubectl get pods -n tacticalops
kubectl get services -n tacticalops
kubectl get ingress -n tacticalops

# Check logs
kubectl logs -f deployment/tacticalops-app -n tacticalops

# Scale deployment
kubectl scale deployment tacticalops-app --replicas=5 -n tacticalops
```

## 🖥️ VPS Deployment

### VPS Integration Strategy
When deploying to an existing VPS with Nginx and Docker, follow these non-disruptive procedures:

#### 1. Environment Analysis
```bash
# Connect to VPS
ssh root@your-vps-ip

# Analyze existing setup
docker ps -a
docker network ls
nginx -t && nginx -s reload
netstat -tlnp | grep :80
netstat -tlnp | grep :443

# Check available ports
ss -tlnp | grep -E ':(3000|3001|5432|6379)'

# Document existing configuration
cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup
docker inspect $(docker ps -q) > existing-containers.json
```

#### 2. Port Allocation Strategy
```bash
# TacticalOps port allocation (avoiding conflicts)
# Web Application: 3000 (internal), 80/443 (nginx proxy)
# API: 3000 (same as web, unified)
# Database: 5432 (internal network only)
# Redis: 6379 (internal network only)
# Monitoring: 9090 (Prometheus), 3001 (Grafana)

# Check for port conflicts
for port in 3000 3001 5432 6379 9090; do
  if netstat -tlnp | grep :$port; then
    echo "Port $port is in use"
  else
    echo "Port $port is available"
  fi
done
```

#### 3. Nginx Integration
```nginx
# /etc/nginx/sites-available/tacticalops
server {
    listen 80;
    server_name tacticalops.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tacticalops.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/ssl/certs/tacticalops.crt;
    ssl_private_key /etc/ssl/private/tacticalops.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

    # Proxy to TacticalOps application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API endpoints
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Rate limiting
        limit_req zone=api burst=20 nodelay;
    }

    # Static files
    location /static/ {
        alias /opt/tacticalops/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Monitoring endpoints (restrict access)
    location /metrics {
        allow 127.0.0.1;
        allow 10.0.0.0/8;
        deny all;
        proxy_pass http://localhost:9090;
    }
}

# Rate limiting configuration
http {
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
}
```

#### 4. Docker Network Integration
```bash
# Create dedicated network for TacticalOps
docker network create tacticalops-network \
  --driver bridge \
  --subnet=172.20.0.0/16 \
  --ip-range=172.20.240.0/20

# Deploy TacticalOps with custom network
docker-compose -f docker-compose.vps.yml up -d

# Verify network integration
docker network inspect tacticalops-network
docker exec tacticalops-app ping -c 3 tacticalops-postgres
```

#### 5. SSL Certificate Setup
```bash
# Install certbot if not present
apt update && apt install certbot python3-certbot-nginx

# Obtain SSL certificate
certbot --nginx -d tacticalops.yourdomain.com

# Verify certificate
certbot certificates

# Set up auto-renewal
crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### VPS Deployment Script
```bash
#!/bin/bash
# deploy-vps.sh - Non-disruptive VPS deployment script

set -e

echo "🚀 Starting TacticalOps VPS Deployment"

# Configuration
DOMAIN="tacticalops.yourdomain.com"
APP_DIR="/opt/tacticalops"
BACKUP_DIR="/opt/backups/tacticalops"

# Create directories
mkdir -p $APP_DIR $BACKUP_DIR

# Backup existing nginx configuration
cp /etc/nginx/nginx.conf $BACKUP_DIR/nginx.conf.$(date +%Y%m%d_%H%M%S)

# Clone or update repository
if [ -d "$APP_DIR/.git" ]; then
    cd $APP_DIR && git pull
else
    git clone https://github.com/tacticalops/platform.git $APP_DIR
    cd $APP_DIR
fi

# Copy environment configuration
cp .env.vps.example .env
echo "📝 Please edit $APP_DIR/.env with your configuration"
read -p "Press Enter after editing .env file..."

# Check for port conflicts
echo "🔍 Checking for port conflicts..."
for port in 3000 3001 5432 6379 9090; do
    if netstat -tlnp | grep :$port > /dev/null; then
        echo "⚠️  Port $port is in use. Please resolve conflicts."
        netstat -tlnp | grep :$port
        exit 1
    fi
done

# Create Docker network
docker network create tacticalops-network --driver bridge || true

# Deploy services
echo "🐳 Deploying Docker containers..."
docker-compose -f docker-compose.vps.yml up -d

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 30

# Health check
echo "🏥 Performing health check..."
if curl -f http://localhost:3000/api/v2/health; then
    echo "✅ Application is healthy"
else
    echo "❌ Application health check failed"
    docker-compose -f docker-compose.vps.yml logs
    exit 1
fi

# Configure Nginx
echo "🌐 Configuring Nginx..."
cp nginx/tacticalops.conf /etc/nginx/sites-available/
ln -sf /etc/nginx/sites-available/tacticalops.conf /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# Setup SSL certificate
echo "🔒 Setting up SSL certificate..."
certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN

# Setup monitoring
echo "📊 Setting up monitoring..."
docker exec tacticalops-app npm run setup:monitoring

# Create backup script
cat > /opt/tacticalops/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/tacticalops/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

# Backup database
docker exec tacticalops-postgres pg_dump -U tacticalops tacticalops > $BACKUP_DIR/database.sql

# Backup application data
tar -czf $BACKUP_DIR/app-data.tar.gz /opt/tacticalops/uploads /opt/tacticalops/logs

# Cleanup old backups (keep 30 days)
find /opt/backups/tacticalops -type d -mtime +30 -exec rm -rf {} +
EOF

chmod +x /opt/tacticalops/backup.sh

# Setup cron job for backups
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/tacticalops/backup.sh") | crontab -

echo "🎉 TacticalOps deployment completed successfully!"
echo "📱 Access your platform at: https://$DOMAIN"
echo "📊 Monitoring available at: https://$DOMAIN/metrics"
echo "📋 Logs: docker-compose -f $APP_DIR/docker-compose.vps.yml logs -f"
```

## 🔐 Security Hardening

### System Security
```bash
# Update system
apt update && apt upgrade -y

# Install security tools
apt install -y fail2ban ufw unattended-upgrades

# Configure firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Configure fail2ban
cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3
EOF

systemctl enable fail2ban
systemctl start fail2ban
```

### Docker Security
```bash
# Create non-root user for Docker
useradd -m -s /bin/bash tacticalops
usermod -aG docker tacticalops

# Secure Docker daemon
cat > /etc/docker/daemon.json << EOF
{
  "live-restore": true,
  "userland-proxy": false,
  "no-new-privileges": true,
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

systemctl restart docker
```

## 📊 Monitoring and Alerting

### Prometheus Configuration
```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

scrape_configs:
  - job_name: 'tacticalops'
    static_configs:
      - targets: ['tacticalops-app:3000']
    metrics_path: '/api/v2/metrics'
    scrape_interval: 30s

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']

  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx:80']

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
```

### Alert Rules
```yaml
# monitoring/alert_rules.yml
groups:
  - name: tacticalops
    rules:
      - alert: HighCPUUsage
        expr: cpu_usage_percent > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage detected"
          description: "CPU usage is above 80% for more than 5 minutes"

      - alert: HighMemoryUsage
        expr: memory_usage_percent > 85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage detected"
          description: "Memory usage is above 85% for more than 5 minutes"

      - alert: ServiceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Service is down"
          description: "{{ $labels.instance }} has been down for more than 1 minute"

      - alert: DatabaseConnectionFailed
        expr: database_connections_failed > 10
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Database connection failures"
          description: "More than 10 database connection failures in 2 minutes"
```

## 🔄 Backup and Recovery

### Automated Backup Strategy
```bash
#!/bin/bash
# backup-strategy.sh

BACKUP_ROOT="/opt/backups/tacticalops"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$BACKUP_ROOT/$DATE"

mkdir -p $BACKUP_DIR

# Database backup
echo "📊 Backing up database..."
docker exec tacticalops-postgres pg_dump -U tacticalops -h localhost tacticalops | gzip > $BACKUP_DIR/database.sql.gz

# Application data backup
echo "📁 Backing up application data..."
tar -czf $BACKUP_DIR/uploads.tar.gz /opt/tacticalops/uploads
tar -czf $BACKUP_DIR/logs.tar.gz /opt/tacticalops/logs
tar -czf $BACKUP_DIR/config.tar.gz /opt/tacticalops/.env /opt/tacticalops/docker-compose.yml

# Redis backup
echo "💾 Backing up Redis data..."
docker exec tacticalops-redis redis-cli BGSAVE
sleep 10
docker cp tacticalops-redis:/data/dump.rdb $BACKUP_DIR/redis-dump.rdb

# Create backup manifest
cat > $BACKUP_DIR/manifest.json << EOF
{
  "backup_date": "$DATE",
  "version": "2.0.0",
  "components": [
    "database",
    "uploads",
    "logs",
    "config",
    "redis"
  ],
  "size": "$(du -sh $BACKUP_DIR | cut -f1)"
}
EOF

# Cleanup old backups (keep 30 days)
find $BACKUP_ROOT -type d -name "20*" -mtime +30 -exec rm -rf {} +

echo "✅ Backup completed: $BACKUP_DIR"
```

### Recovery Procedures
```bash
#!/bin/bash
# recovery.sh

BACKUP_DIR=$1
if [ -z "$BACKUP_DIR" ]; then
    echo "Usage: $0 <backup_directory>"
    exit 1
fi

echo "🔄 Starting recovery from $BACKUP_DIR"

# Stop services
docker-compose down

# Restore database
echo "📊 Restoring database..."
gunzip -c $BACKUP_DIR/database.sql.gz | docker exec -i tacticalops-postgres psql -U tacticalops -d tacticalops

# Restore application data
echo "📁 Restoring application data..."
tar -xzf $BACKUP_DIR/uploads.tar.gz -C /
tar -xzf $BACKUP_DIR/config.tar.gz -C /

# Restore Redis data
echo "💾 Restoring Redis data..."
docker cp $BACKUP_DIR/redis-dump.rdb tacticalops-redis:/data/dump.rdb

# Start services
docker-compose up -d

# Verify recovery
sleep 30
if curl -f http://localhost:3000/api/v2/health; then
    echo "✅ Recovery completed successfully"
else
    echo "❌ Recovery failed - check logs"
    docker-compose logs
fi
```

## 📞 Support and Troubleshooting

### Common Deployment Issues

#### Port Conflicts
```bash
# Check for port conflicts
netstat -tlnp | grep -E ':(3000|5432|6379)'

# Find process using port
lsof -i :3000

# Kill process if necessary
kill -9 $(lsof -t -i:3000)
```

#### Docker Issues
```bash
# Check Docker status
systemctl status docker

# View container logs
docker-compose logs -f tacticalops-app

# Restart containers
docker-compose restart

# Clean up Docker resources
docker system prune -a
```

#### Database Connection Issues
```bash
# Test database connection
docker exec tacticalops-postgres psql -U tacticalops -d tacticalops -c "SELECT version();"

# Check database logs
docker logs tacticalops-postgres

# Reset database password
docker exec -it tacticalops-postgres psql -U postgres -c "ALTER USER tacticalops PASSWORD 'new_password';"
```

### Support Channels
- **Documentation**: [Complete deployment docs](../README.md)
- **GitHub Issues**: [Report deployment issues](https://github.com/tacticalops/platform/issues)
- **Discord**: [Deployment support channel](https://discord.gg/tacticalops-deploy)
- **Email**: deployment-support@tacticalops.com

---

**🚀 TacticalOps Platform - Production-Ready Tactical Operations Deployment**

*Scalable • Secure • Mission-Critical*