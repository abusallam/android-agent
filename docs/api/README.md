# 🔌 TacticalOps Platform API Reference

## Overview

The TacticalOps Platform provides comprehensive REST APIs for all platform functionality, designed for both human users and AI agents. The API is organized into logical modules with consistent patterns and robust security.

## 🚀 Quick Start

### Base URL
```
https://your-instance.com/api/v2
```

### Authentication
```bash
# Get authentication token
curl -X POST https://your-instance.com/api/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "your-username", "password": "your-password"}'

# Use token in requests
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://your-instance.com/api/v2/system/status
```

### Response Format
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation completed successfully",
  "timestamp": "2025-01-12T10:30:00Z",
  "requestId": "req_123456789"
}
```

## 📚 API Modules

### 🔐 Authentication & Authorization
- [**Authentication API**](auth.md) - Login, logout, token management
- [**User Management API**](users.md) - User accounts and profiles
- [**Role Management API**](roles.md) - Roles and permissions
- [**Session Management API**](sessions.md) - Session handling

### 🖥️ System Management
- [**System API**](system.md) - System status and health
- [**Configuration API**](config.md) - System configuration
- [**Monitoring API**](monitoring.md) - Performance metrics
- [**Logs API**](logs.md) - System logs and audit trails

### 🗺️ Tactical Operations
- [**Mapping API**](mapping.md) - Maps, layers, and geospatial data
- [**Navigation API**](navigation.md) - Routing and waypoints
- [**Tracking API**](tracking.md) - Location tracking and history
- [**Overlays API**](overlays.md) - Map overlays and annotations

### 🚨 Emergency Response
- [**Emergency API**](emergency.md) - Emergency alerts and incidents
- [**Contacts API**](contacts.md) - Emergency contacts management
- [**Resources API**](resources.md) - Resource allocation and tracking
- [**Incidents API**](incidents.md) - Incident reporting and management

### 📡 Communication
- [**Messaging API**](messaging.md) - Secure messaging and chat
- [**Channels API**](channels.md) - Communication channels
- [**Files API**](files.md) - File sharing and management
- [**Notifications API**](notifications.md) - Push notifications

### 🤖 Agent Interface
- [**Agent API**](agent.md) - AI agent integration endpoints
- [**Tasks API**](tasks.md) - Task scheduling and automation
- [**Workflows API**](workflows.md) - Complex workflow management
- [**Intelligence API**](intelligence.md) - Data analysis and insights

### 🔌 Integration
- [**Plugins API**](plugins.md) - Plugin management and execution
- [**Webhooks API**](webhooks.md) - External system integration
- [**Import/Export API**](import-export.md) - Data import and export
- [**External API**](external.md) - Third-party service integration

## 🔒 Security

### API Security Features
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access**: Granular permission control
- **Rate Limiting**: Prevent abuse and ensure fair usage
- **Input Validation**: Comprehensive request validation
- **Audit Logging**: Complete API access logging

### Security Headers
```http
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
X-API-Version: v2
X-Request-ID: unique-request-id
X-Client-Version: 2.0.0
```

### Error Handling
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input parameters",
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    }
  },
  "timestamp": "2025-01-12T10:30:00Z",
  "requestId": "req_123456789"
}
```

## 📊 API Tiers

### 🌍 Civilian Tier APIs
- Basic authentication and user management
- Standard mapping and navigation features
- Basic emergency response capabilities
- Community messaging and file sharing
- Open plugin ecosystem access

### 🏛️ Government Tier APIs
- Enhanced authentication with MFA
- Advanced mapping with satellite imagery
- Comprehensive emergency response
- Secure inter-agency communication
- Government-certified plugin access
- Audit and compliance features

### 🎖️ Military Tier APIs
- PKI-based authentication
- Classified mapping and intelligence
- Advanced tactical operations
- Military-grade secure communications
- Specialized military plugins
- Classification management

## 🤖 Agent-Specific APIs

### Agent Authentication
```bash
# Agent authentication with API key
curl -X POST https://your-instance.com/api/v2/agent/auth \
  -H "X-API-Key: YOUR_AGENT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"agentId": "tactical-monitor-001", "capabilities": ["monitoring", "analysis"]}'
```

### Agent Endpoints
```bash
# System monitoring
GET /api/v2/agent/system/status
GET /api/v2/agent/system/health
GET /api/v2/agent/system/metrics

# Task management
POST /api/v2/agent/tasks/schedule
GET /api/v2/agent/tasks/status
PUT /api/v2/agent/tasks/{taskId}/execute

# Natural language interface
POST /api/v2/agent/nlp/query
POST /api/v2/agent/nlp/command
GET /api/v2/agent/nlp/context
```

## 📈 Rate Limits

### Standard Rate Limits
- **Civilian Tier**: 1,000 requests/hour per user
- **Government Tier**: 5,000 requests/hour per user
- **Military Tier**: 10,000 requests/hour per user
- **Agent API**: 10,000 requests/hour per agent

### Rate Limit Headers
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1641988800
X-RateLimit-Retry-After: 3600
```

## 🔄 Versioning

### API Versioning Strategy
- **Current Version**: v2
- **Supported Versions**: v2 (current), v1 (deprecated)
- **Version Header**: `X-API-Version: v2`
- **URL Versioning**: `/api/v2/endpoint`

### Deprecation Policy
- 6 months notice for breaking changes
- Backward compatibility maintained when possible
- Migration guides provided for major changes
- Legacy version support for 12 months

## 📝 OpenAPI Specification

### Swagger Documentation
- **Interactive Docs**: `https://your-instance.com/api/docs`
- **OpenAPI Spec**: `https://your-instance.com/api/openapi.json`
- **Postman Collection**: Available for download
- **SDK Generation**: Auto-generated SDKs available

### Code Examples

#### JavaScript/Node.js
```javascript
const TacticalOpsAPI = require('@tacticalops/api-client');

const client = new TacticalOpsAPI({
  baseURL: 'https://your-instance.com/api/v2',
  apiKey: 'your-api-key'
});

// Get system status
const status = await client.system.getStatus();
console.log('System Status:', status);
```

#### Python
```python
from tacticalops import TacticalOpsClient

client = TacticalOpsClient(
    base_url='https://your-instance.com/api/v2',
    api_key='your-api-key'
)

# Get system status
status = client.system.get_status()
print(f'System Status: {status}')
```

#### cURL
```bash
# Get system status
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://your-instance.com/api/v2/system/status
```

## 🧪 Testing

### API Testing Tools
- **Postman Collection**: Complete API collection for testing
- **Insomnia Workspace**: Alternative REST client setup
- **Unit Tests**: Comprehensive test suite included
- **Integration Tests**: End-to-end API testing
- **Load Testing**: Performance and scalability testing

### Test Environment
- **Base URL**: `https://test.tacticalops.com/api/v2`
- **Test Credentials**: Provided in developer portal
- **Rate Limits**: Relaxed for testing purposes
- **Data Reset**: Test data reset daily
- **Monitoring**: Test environment monitoring available

## 📞 Support

### Developer Support
- **Documentation**: Comprehensive API documentation
- **Code Examples**: Working examples in multiple languages
- **SDKs**: Official SDKs for popular languages
- **Community**: Developer community and forums
- **Support**: Technical support for API integration

### Resources
- **GitHub**: [API client libraries](https://github.com/tacticalops/api-clients)
- **Discord**: [Developer community](https://discord.gg/tacticalops-dev)
- **Email**: api-support@tacticalops.com
- **Status Page**: [API status and uptime](https://status.tacticalops.com)

---

**🔌 TacticalOps Platform API - Powering Tactical Operations Through Code**

*Comprehensive • Secure • Agent-Ready*