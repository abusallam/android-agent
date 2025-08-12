# 🧠 Agent Knowledge Base - TacticalOps Platform

## Overview

This knowledge base provides AI agents with comprehensive information about the TacticalOps Platform, including system architecture, operational procedures, tactical knowledge, and troubleshooting guidance.

## 🏗️ System Architecture Knowledge

### Platform Components
```json
{
  "platform": {
    "name": "TacticalOps Platform",
    "version": "2.0.0",
    "architecture": "microservices",
    "deployment": "containerized",
    "components": {
      "frontend": {
        "pwa_dashboard": {
          "technology": "Next.js 15 + React 19",
          "purpose": "Command and control interface",
          "users": ["administrators", "operators", "commanders"]
        },
        "mobile_app": {
          "technology": "React Native + Expo SDK 53",
          "purpose": "Field operations interface",
          "users": ["field_personnel", "responders", "agents"]
        }
      },
      "backend": {
        "api_gateway": {
          "technology": "Next.js API Routes",
          "purpose": "Unified API access point",
          "features": ["authentication", "rate_limiting", "routing"]
        },
        "services": {
          "tactical_service": "Mission planning and execution",
          "emergency_service": "Emergency response coordination",
          "communication_service": "Secure messaging and protocols",
          "mapping_service": "Geospatial data and navigation",
          "security_service": "Authentication and authorization",
          "plugin_service": "Extensible functionality"
        }
      },
      "data": {
        "postgresql": "Primary relational database",
        "redis": "Caching and session storage",
        "minio": "File and object storage",
        "influxdb": "Time series metrics data"
      }
    }
  }
}
```

### Security Architecture
```json
{
  "security": {
    "tiers": {
      "civilian": {
        "encryption": "TLS 1.2+, AES-256",
        "authentication": "JWT + Password",
        "features": ["basic_audit", "standard_compliance"]
      },
      "government": {
        "encryption": "TLS 1.3 + Certificate Pinning, XChaCha20-Poly1305",
        "authentication": "MFA (TOTP/SMS/Email)",
        "features": ["enhanced_audit", "compliance_monitoring", "inter_agency"]
      },
      "military": {
        "encryption": "Military-grade, PKI-based, Classification-aware",
        "authentication": "PKI Certificates + CAC/PIV Cards",
        "features": ["classification_management", "air_gap_support", "comsec"]
      }
    },
    "protocols": {
      "transport": "TLS 1.3 with mutual authentication",
      "application": "End-to-end encryption with libsodium",
      "key_management": "Argon2id + X25519 ECDH",
      "audit": "Comprehensive logging with tamper protection"
    }
  }
}
```

## 🎯 Tactical Operations Knowledge

### Mission Types
```json
{
  "mission_types": {
    "emergency_response": {
      "description": "Disaster response and emergency coordination",
      "priorities": ["life_safety", "property_protection", "environmental_protection"],
      "resources": ["personnel", "vehicles", "equipment", "supplies"],
      "procedures": ["assessment", "planning", "execution", "recovery"]
    },
    "search_rescue": {
      "description": "Search and rescue operations",
      "priorities": ["locate_missing", "extract_safely", "provide_medical"],
      "resources": ["search_teams", "aircraft", "medical", "communication"],
      "procedures": ["area_search", "tracking", "extraction", "medical_care"]
    },
    "tactical_operations": {
      "description": "Military and law enforcement operations",
      "priorities": ["mission_success", "force_protection", "operational_security"],
      "resources": ["personnel", "weapons", "vehicles", "intelligence"],
      "procedures": ["planning", "briefing", "execution", "debrief"]
    },
    "humanitarian_aid": {
      "description": "Humanitarian assistance operations",
      "priorities": ["civilian_protection", "aid_delivery", "coordination"],
      "resources": ["aid_supplies", "logistics", "security", "communication"],
      "procedures": ["assessment", "coordination", "distribution", "monitoring"]
    }
  }
}
```

### Emergency Response Procedures
```json
{
  "emergency_procedures": {
    "panic_button": {
      "trigger": "User presses panic button or automatic detection",
      "immediate_actions": [
        "Record GPS coordinates and timestamp",
        "Capture device sensor data (accelerometer, gyroscope)",
        "Take photo/video if camera available",
        "Send encrypted alert to emergency contacts",
        "Escalate to emergency services if configured"
      ],
      "follow_up_actions": [
        "Monitor for response acknowledgment",
        "Provide continuous location updates",
        "Maintain communication channel",
        "Coordinate with responders"
      ]
    },
    "man_down_detection": {
      "triggers": ["accelerometer_threshold", "gyroscope_anomaly", "no_movement_timeout"],
      "verification": [
        "Audio alert to user (30 seconds)",
        "Vibration alert if available",
        "Request user confirmation",
        "If no response, escalate to panic button procedure"
      ]
    },
    "casevac_planning": {
      "assessment": [
        "Determine casualty priority (P1-P4)",
        "Assess medical requirements",
        "Evaluate extraction options",
        "Consider security situation"
      ],
      "planning": [
        "Select optimal extraction route",
        "Coordinate medical assets",
        "Prepare landing/pickup zones",
        "Brief all personnel involved"
      ]
    }
  }
}
```

### Communication Protocols
```json
{
  "communication_protocols": {
    "priority_levels": {
      "immediate": {
        "description": "Life-threatening emergencies",
        "response_time": "< 30 seconds",
        "channels": ["emergency_frequency", "satellite", "cellular"]
      },
      "urgent": {
        "description": "Time-sensitive operational matters",
        "response_time": "< 5 minutes",
        "channels": ["primary_frequency", "secure_messaging"]
      },
      "routine": {
        "description": "Standard operational communication",
        "response_time": "< 30 minutes",
        "channels": ["standard_channels", "email", "messaging"]
      }
    },
    "message_formats": {
      "sitrep": {
        "structure": ["DTG", "location", "situation", "actions", "resources", "next_report"],
        "frequency": "Every 30 minutes or on significant change"
      },
      "medevac_request": {
        "structure": ["location", "frequency", "patients", "security", "marking"],
        "priority": "immediate"
      }
    }
  }
}
```

## 🔧 System Operations Knowledge

### Service Management
```json
{
  "services": {
    "critical_services": [
      {
        "name": "api-gateway",
        "description": "Main API access point",
        "health_check": "GET /api/v2/health",
        "restart_command": "systemctl restart tacticalops-api",
        "dependencies": ["postgresql", "redis"]
      },
      {
        "name": "tactical-service",
        "description": "Tactical operations management",
        "health_check": "GET /api/v2/tactical/health",
        "restart_command": "systemctl restart tacticalops-tactical",
        "dependencies": ["api-gateway", "postgresql"]
      },
      {
        "name": "emergency-service",
        "description": "Emergency response coordination",
        "health_check": "GET /api/v2/emergency/health",
        "restart_command": "systemctl restart tacticalops-emergency",
        "dependencies": ["api-gateway", "communication-service"]
      }
    ],
    "monitoring_thresholds": {
      "cpu_usage": {
        "warning": 70,
        "critical": 85,
        "action": "Scale up or optimize processes"
      },
      "memory_usage": {
        "warning": 75,
        "critical": 90,
        "action": "Restart service or add memory"
      },
      "disk_usage": {
        "warning": 80,
        "critical": 95,
        "action": "Clean logs or expand storage"
      },
      "response_time": {
        "warning": 1000,
        "critical": 5000,
        "action": "Investigate performance issues"
      }
    }
  }
}
```

### Database Operations
```json
{
  "database": {
    "postgresql": {
      "primary_tables": [
        "users", "organizations", "missions", "incidents", 
        "locations", "communications", "resources", "audit_logs"
      ],
      "backup_schedule": "Daily at 02:00 UTC",
      "retention_policy": "30 days full, 1 year incremental",
      "monitoring": {
        "connection_count": "< 80% of max_connections",
        "query_time": "< 1000ms average",
        "lock_waits": "< 5% of queries"
      }
    },
    "redis": {
      "usage": ["session_storage", "caching", "real_time_data"],
      "memory_policy": "allkeys-lru",
      "persistence": "RDB + AOF",
      "monitoring": {
        "memory_usage": "< 80% of available",
        "hit_ratio": "> 90%",
        "connection_count": "< max_clients"
      }
    }
  }
}
```

## 🚨 Troubleshooting Knowledge

### Common Issues and Solutions
```json
{
  "troubleshooting": {
    "authentication_failures": {
      "symptoms": ["401 Unauthorized", "Token expired", "Invalid credentials"],
      "causes": [
        "Expired JWT token",
        "Invalid API key",
        "User account disabled",
        "Clock synchronization issues"
      ],
      "solutions": [
        "Refresh JWT token",
        "Verify API key validity",
        "Check user account status",
        "Synchronize system clock"
      ]
    },
    "performance_degradation": {
      "symptoms": ["Slow response times", "Timeouts", "High CPU/Memory usage"],
      "causes": [
        "Database query optimization needed",
        "Memory leaks in application",
        "Network connectivity issues",
        "Insufficient resources"
      ],
      "solutions": [
        "Optimize database queries and indexes",
        "Restart affected services",
        "Check network connectivity",
        "Scale up resources or optimize code"
      ]
    },
    "communication_failures": {
      "symptoms": ["Messages not delivered", "Connection timeouts", "Protocol errors"],
      "causes": [
        "Network connectivity issues",
        "Service unavailability",
        "Protocol configuration errors",
        "Security policy blocking"
      ],
      "solutions": [
        "Check network connectivity",
        "Verify service status",
        "Review protocol configurations",
        "Check firewall and security policies"
      ]
    }
  }
}
```

### Diagnostic Commands
```json
{
  "diagnostics": {
    "system_health": [
      "curl -f http://localhost:3000/api/v2/health",
      "systemctl status tacticalops-*",
      "docker ps --filter name=tacticalops",
      "df -h",
      "free -m",
      "top -p $(pgrep -d',' -f tacticalops)"
    ],
    "database_health": [
      "psql -c 'SELECT version();'",
      "psql -c 'SELECT count(*) FROM pg_stat_activity;'",
      "redis-cli ping",
      "redis-cli info memory"
    ],
    "network_connectivity": [
      "ping -c 4 8.8.8.8",
      "nslookup your-domain.com",
      "netstat -tlnp | grep :3000",
      "ss -tlnp | grep tacticalops"
    ]
  }
}
```

## 📊 Performance Baselines

### Expected Performance Metrics
```json
{
  "performance_baselines": {
    "api_response_times": {
      "authentication": "< 200ms",
      "system_status": "< 100ms",
      "map_data": "< 500ms",
      "emergency_alert": "< 50ms",
      "file_upload": "< 2000ms per MB"
    },
    "system_resources": {
      "cpu_usage_idle": "< 10%",
      "cpu_usage_normal": "< 50%",
      "memory_usage_idle": "< 30%",
      "memory_usage_normal": "< 60%",
      "disk_io_normal": "< 100 IOPS"
    },
    "concurrent_users": {
      "civilian_tier": "up to 100 concurrent users",
      "government_tier": "up to 500 concurrent users",
      "military_tier": "up to 1000 concurrent users"
    }
  }
}
```

## 🔐 Security Procedures

### Incident Response
```json
{
  "security_incidents": {
    "detection": {
      "indicators": [
        "Multiple failed authentication attempts",
        "Unusual API access patterns",
        "Unauthorized privilege escalation attempts",
        "Suspicious network traffic",
        "Data exfiltration attempts"
      ],
      "monitoring": [
        "Real-time log analysis",
        "Behavioral anomaly detection",
        "Network traffic monitoring",
        "File integrity monitoring"
      ]
    },
    "response_procedures": {
      "immediate": [
        "Isolate affected systems",
        "Preserve evidence",
        "Notify security team",
        "Document incident details"
      ],
      "investigation": [
        "Analyze logs and evidence",
        "Determine scope and impact",
        "Identify attack vectors",
        "Assess data compromise"
      ],
      "recovery": [
        "Patch vulnerabilities",
        "Restore from clean backups",
        "Update security policies",
        "Conduct lessons learned"
      ]
    }
  }
}
```

## 🤖 Agent-Specific Knowledge

### Agent Capabilities Matrix
```json
{
  "agent_capabilities": {
    "system_monitoring": {
      "permissions": ["system:read", "metrics:read", "logs:read"],
      "functions": [
        "monitor_system_health",
        "analyze_performance_metrics",
        "detect_anomalies",
        "generate_alerts"
      ],
      "thresholds": {
        "cpu_warning": 70,
        "memory_warning": 75,
        "disk_warning": 80,
        "response_time_warning": 1000
      }
    },
    "tactical_operations": {
      "permissions": ["tactical:read", "tactical:write", "missions:manage"],
      "functions": [
        "analyze_tactical_situation",
        "plan_missions",
        "coordinate_resources",
        "provide_guidance"
      ],
      "knowledge_areas": [
        "mission_planning",
        "resource_optimization",
        "threat_assessment",
        "operational_procedures"
      ]
    },
    "emergency_response": {
      "permissions": ["emergency:read", "emergency:write", "communications:send"],
      "functions": [
        "process_emergency_alerts",
        "coordinate_response",
        "manage_resources",
        "communicate_with_responders"
      ],
      "response_times": {
        "panic_button": "< 5 seconds",
        "man_down": "< 10 seconds",
        "general_emergency": "< 30 seconds"
      }
    }
  }
}
```

### Natural Language Processing Patterns
```json
{
  "nlp_patterns": {
    "system_queries": {
      "patterns": [
        "what is the system status",
        "show me system health",
        "are all services running",
        "check system performance"
      ],
      "intent": "system_status",
      "action": "get_system_status"
    },
    "emergency_commands": {
      "patterns": [
        "trigger emergency alert",
        "send panic signal",
        "alert emergency contacts",
        "activate emergency response"
      ],
      "intent": "emergency_alert",
      "action": "trigger_emergency_alert"
    },
    "tactical_queries": {
      "patterns": [
        "analyze tactical situation",
        "plan mission route",
        "optimize resource allocation",
        "assess threat level"
      ],
      "intent": "tactical_analysis",
      "action": "perform_tactical_analysis"
    }
  }
}
```

## 📚 Reference Information

### API Endpoints Reference
```json
{
  "api_endpoints": {
    "system": {
      "health": "GET /api/v2/system/health",
      "status": "GET /api/v2/system/status",
      "metrics": "GET /api/v2/system/metrics",
      "logs": "GET /api/v2/system/logs"
    },
    "tactical": {
      "missions": "GET /api/v2/tactical/missions",
      "create_mission": "POST /api/v2/tactical/missions",
      "update_mission": "PUT /api/v2/tactical/missions/{id}",
      "analyze": "POST /api/v2/tactical/analyze"
    },
    "emergency": {
      "alerts": "GET /api/v2/emergency/alerts",
      "trigger": "POST /api/v2/emergency/trigger",
      "contacts": "GET /api/v2/emergency/contacts",
      "incidents": "GET /api/v2/emergency/incidents"
    },
    "agent": {
      "authenticate": "POST /api/v2/agent/auth",
      "execute": "POST /api/v2/agent/execute",
      "schedule": "POST /api/v2/agent/schedule",
      "status": "GET /api/v2/agent/status"
    }
  }
}
```

### Configuration Templates
```json
{
  "configuration_templates": {
    "agent_config": {
      "id": "agent-{type}-{instance}",
      "name": "TacticalOps {Type} Agent",
      "capabilities": ["monitoring", "analysis", "response"],
      "security": {
        "encryption": true,
        "authentication": "jwt-bearer",
        "permissions": ["system:read", "tactical:read"]
      },
      "monitoring": {
        "interval": 30000,
        "metrics": ["system", "performance", "security"]
      }
    },
    "service_config": {
      "name": "tacticalops-{service}",
      "port": "{service_port}",
      "database": {
        "host": "localhost",
        "port": 5432,
        "database": "tacticalops"
      },
      "redis": {
        "host": "localhost",
        "port": 6379
      }
    }
  }
}
```

---

**🧠 This knowledge base is continuously updated to reflect the latest platform capabilities and operational procedures. Agents should reference this information for accurate system understanding and optimal performance.**