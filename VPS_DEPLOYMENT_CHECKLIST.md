# 🎖️ TacticalOps Platform - VPS Deployment Checklist

## 📋 **PRE-DEPLOYMENT REQUIREMENTS**

### **VPS Information Needed**
- [ ] **VPS IP Address**: `_________________`
- [ ] **SSH Username**: `_________________` (usually `root`)
- [ ] **SSH Password/Key**: `_________________`
- [ ] **Domain Name**: `_________________` (optional but recommended)

### **VPS Prerequisites**
- [ ] **Operating System**: Linux (Ubuntu 20.04+, Debian 11+, CentOS 8+)
- [ ] **Docker**: Version 20.0+ installed and running
- [ ] **Docker Compose**: Version 2.0+ installed
- [ ] **Nginx**: Installed and running
- [ ] **SSH Access**: Root or sudo access available
- [ ] **Ports Available**: 80, 443, 3000, 5432, 6379, 9090, 3001

### **Local Prerequisites**
- [ ] **SSH Client**: Available on deployment machine
- [ ] **Git**: Repository cloned locally
- [ ] **Network Access**: Can reach VPS from deployment machine

---

## 🚀 **DEPLOYMENT PROCESS**

### **Step 1: Environment Analysis**
```bash
# Analyze existing VPS setup (dry run)
./deploy-vps.sh -d yourdomain.com -i YOUR_VPS_IP --dry-run

# This will show:
# - Current Docker containers
# - Port usage
# - Nginx configuration
# - Available resources
```

### **Step 2: Backup Existing Setup**
```bash
# Create backup of current VPS state
./deploy-vps.sh -d yourdomain.com -i YOUR_VPS_IP --skip-deploy --backup-only

# Backup includes:
# - Nginx configuration
# - Docker containers list
# - Existing applications
```

### **Step 3: Deploy TacticalOps**
```bash
# Deploy to VPS (civilian tier)
./deploy-vps.sh -d yourdomain.com -i YOUR_VPS_IP -t civilian

# For government tier:
./deploy-vps.sh -d yourdomain.com -i YOUR_VPS_IP -t government

# For military tier:
./deploy-vps.sh -d yourdomain.com -i YOUR_VPS_IP -t military
```

### **Step 4: Validate Deployment**
```bash
# Run comprehensive tests
./test-production-readiness.js --base-url=https://yourdomain.com

# Quick health check
curl https://yourdomain.com/api/v2/health
```

---

## 🔧 **DEPLOYMENT CONFIGURATION**

### **Environment Variables**
The deployment script will automatically generate secure environment variables:
- **Database Password**: Auto-generated secure password
- **Redis Password**: Auto-generated secure password
- **JWT Secret**: Auto-generated 32-character secret
- **Encryption Key**: Auto-generated encryption key
- **Agent API Key**: Auto-generated agent authentication key

### **SSL Certificate**
- **Automatic**: Let's Encrypt certificate (if domain provided)
- **Fallback**: Self-signed certificate for IP-only access
- **Manual**: Custom certificate can be provided

### **Resource Allocation**
```yaml
# Default resource limits
Application: 1GB RAM, 1 CPU core
Database: 2GB RAM, 1 CPU core
Redis: 512MB RAM, 0.5 CPU core
Monitoring: 1GB RAM, 0.5 CPU core
```

---

## 🔐 **SECURITY CONFIGURATION**

### **Firewall Rules**
```bash
# Required ports (automatically configured)
80/tcp   - HTTP (redirects to HTTPS)
443/tcp  - HTTPS (main application)
22/tcp   - SSH (existing)

# Internal ports (Docker network only)
3000/tcp - Application server
5432/tcp - PostgreSQL
6379/tcp - Redis
9090/tcp - Prometheus
3001/tcp - Grafana
```

### **Access Control**
- **Public Access**: Web application (port 80/443)
- **Restricted Access**: Monitoring dashboards (internal networks only)
- **No External Access**: Database and cache (Docker network only)

---

## 📊 **POST-DEPLOYMENT VALIDATION**

### **Health Checks**
- [ ] **Application Health**: `https://yourdomain.com/api/v2/health`
- [ ] **Database Connection**: Verified through health endpoint
- [ ] **Redis Connection**: Verified through health endpoint
- [ ] **SSL Certificate**: Valid and trusted
- [ ] **Monitoring**: Prometheus and Grafana accessible

### **Functional Tests**
- [ ] **User Registration**: Can create user accounts
- [ ] **Authentication**: Login/logout working
- [ ] **Agent API**: Agent authentication successful
- [ ] **Emergency Alerts**: Can create and manage alerts
- [ ] **Real-time Features**: WebSocket connections working

### **Performance Validation**
- [ ] **Response Time**: < 2 seconds for main pages
- [ ] **API Performance**: < 100ms for health checks
- [ ] **Concurrent Users**: Tested with multiple simultaneous connections
- [ ] **Resource Usage**: CPU and memory within acceptable limits

---

## 🤖 **AGENT INTEGRATION TESTING**

### **Agent Authentication**
```bash
# Test agent authentication
curl -X POST https://yourdomain.com/api/agent/auth \
  -H "X-API-Key: YOUR_AGENT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "test-agent-001",
    "capabilities": ["system-monitoring", "tactical-operations"]
  }'
```

### **Agent Functionality**
```bash
# Test system monitoring
curl -X GET https://yourdomain.com/api/agent/system \
  -H "Authorization: Bearer YOUR_AGENT_TOKEN"

# Test natural language processing
curl -X POST https://yourdomain.com/api/agent/nlp \
  -H "Authorization: Bearer YOUR_AGENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "process_query",
    "query": "What is the system status?"
  }'
```

---

## 📚 **ACCESS INFORMATION**

### **Application URLs**
- **Main Application**: `https://yourdomain.com`
- **API Endpoint**: `https://yourdomain.com/api/v2`
- **Health Check**: `https://yourdomain.com/api/v2/health`
- **Agent API**: `https://yourdomain.com/api/agent`

### **Monitoring URLs** (Internal Access Only)
- **Grafana Dashboard**: `https://yourdomain.com/grafana`
- **Prometheus Metrics**: `http://VPS_IP:9090` (internal)

### **Default Credentials**
- **Application Admin**: Created during first setup
- **Grafana Admin**: `admin` / `auto-generated-password`
- **Database**: `tacticalops` / `auto-generated-password`

---

## 🔄 **MAINTENANCE TASKS**

### **Daily Automated Tasks**
- [ ] **Database Backup**: Automated at 2:00 AM
- [ ] **Log Rotation**: Automated log cleanup
- [ ] **Health Monitoring**: Continuous health checks
- [ ] **Security Scanning**: Automated vulnerability checks

### **Weekly Manual Tasks**
- [ ] **System Updates**: Security patches and updates
- [ ] **Backup Verification**: Test backup restoration
- [ ] **Performance Review**: Check metrics and optimize
- [ ] **Agent Performance**: Review agent logs and performance

### **Monthly Tasks**
- [ ] **Security Audit**: Review access logs and security events
- [ ] **Capacity Planning**: Review resource usage and scaling needs
- [ ] **Documentation Update**: Update procedures and documentation
- [ ] **Disaster Recovery Test**: Test complete system recovery

---

## 🚨 **TROUBLESHOOTING**

### **Common Issues**
1. **Port Conflicts**
   ```bash
   # Check port usage
   netstat -tlnp | grep -E ':(80|443|3000|5432|6379)'
   
   # Solution: Stop conflicting services or change ports
   ```

2. **SSL Certificate Issues**
   ```bash
   # Check certificate status
   certbot certificates
   
   # Renew certificate
   certbot renew
   ```

3. **Container Issues**
   ```bash
   # Check container status
   docker-compose ps
   
   # View logs
   docker-compose logs -f tacticalops-app
   
   # Restart services
   docker-compose restart
   ```

### **Emergency Procedures**
1. **Rollback Deployment**
   ```bash
   # Stop TacticalOps containers
   cd /opt/tacticalops && docker-compose down
   
   # Restore from backup
   # (Backup restoration procedures in deployment script)
   ```

2. **Service Recovery**
   ```bash
   # Restart all services
   cd /opt/tacticalops && docker-compose restart
   
   # Check health
   ./test-production-readiness.js
   ```

---

## ✅ **DEPLOYMENT COMPLETION CHECKLIST**

### **Technical Validation**
- [ ] All containers running and healthy
- [ ] SSL certificate installed and valid
- [ ] Database migrations completed
- [ ] Monitoring and alerting configured
- [ ] Backup procedures operational
- [ ] Security configurations applied

### **Functional Validation**
- [ ] Web application accessible
- [ ] User authentication working
- [ ] Agent API functional
- [ ] Emergency systems operational
- [ ] Real-time features working
- [ ] Mobile app connectivity tested

### **Documentation**
- [ ] Deployment details documented
- [ ] Access credentials recorded securely
- [ ] Maintenance procedures reviewed
- [ ] Emergency contacts updated
- [ ] User training materials prepared

---

## 📞 **SUPPORT CONTACTS**

### **Technical Support**
- **Documentation**: [Complete deployment docs](docs/deployment/README.md)
- **GitHub Issues**: [Report deployment issues](https://github.com/tacticalops/platform/issues)
- **Email**: deployment-support@tacticalops.com

### **Emergency Support**
- **Critical Issues**: 24/7 support available for military tier
- **Security Incidents**: Immediate response for government/military tiers
- **System Recovery**: Complete disaster recovery procedures available

---

**🎖️ Ready for VPS Deployment!**

*Please provide your VPS credentials and domain information to proceed with deployment.*