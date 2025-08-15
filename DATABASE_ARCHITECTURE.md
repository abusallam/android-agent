# 🗄️ TacticalOps Database Architecture

## 📋 **Database Stack Overview**

TacticalOps uses a **hybrid multi-database architecture** optimized for different deployment scenarios and performance requirements.

### 🏗️ **Architecture Components**

```mermaid
graph TB
    subgraph "Cloud Infrastructure"
        SB[Supabase Cloud PostgreSQL]
        SB_API[Supabase API Layer]
        SB_AUTH[Supabase Auth]
        SB_RT[Supabase Realtime]
    end
    
    subgraph "VPS Container Stack"
        PG[PostgreSQL Container]
        REDIS[Redis Container]
        APP[Next.js App Container]
    end
    
    subgraph "Mobile Application"
        EXPO[Expo React Native App]
        SQLITE[SQLite Local Database]
    end
    
    subgraph "Data Flow"
        SB --> SB_API
        SB_API --> APP
        APP --> PG
        APP --> REDIS
        APP --> EXPO
        EXPO --> SQLITE
        SQLITE --> APP
    end
    
    classDef cloud fill:#e1f5fe
    classDef container fill:#f3e5f5
    classDef mobile fill:#e8f5e8
    
    class SB,SB_API,SB_AUTH,SB_RT cloud
    class PG,REDIS,APP container
    class EXPO,SQLITE mobile
```

## 🎯 **Database Usage by Component**

### 1. **Supabase Cloud PostgreSQL** (Primary Production Database)
- **Purpose**: Main production database for web platform
- **Usage**: 
  - User authentication and management
  - Device registration and metadata
  - Real-time data synchronization
  - Analytics and reporting
  - Backup and disaster recovery
- **Features**:
  - Real-time subscriptions
  - Row Level Security (RLS)
  - Built-in authentication
  - Automatic backups
  - Global CDN

### 2. **PostgreSQL Container** (VPS Backup & Networking)
- **Purpose**: Local backup, networking, and provisioning
- **Usage**:
  - Local data backup and redundancy
  - Network-isolated operations
  - Development and testing
  - Offline capability
  - Data provisioning and migration
- **Features**:
  - Full PostgreSQL compatibility
  - Local network performance
  - Container orchestration
  - Custom extensions (PostGIS for mapping)

### 3. **SQLite** (Mobile Application)
- **Purpose**: Local mobile database for Expo React Native app
- **Usage**:
  - Offline-first mobile experience
  - Local caching and performance
  - Device-specific data storage
  - Sync queue management
  - Background data processing
- **Features**:
  - Zero-configuration
  - Embedded database
  - Cross-platform compatibility
  - Excellent performance for mobile

### 4. **Redis** (Caching & Sessions)
- **Purpose**: High-performance caching and session management
- **Usage**:
  - Session storage
  - Real-time data caching
  - WebSocket connection management
  - Rate limiting
  - Background job queues

## 🔄 **Data Synchronization Flow**

```mermaid
sequenceDiagram
    participant Mobile as Expo Mobile App
    participant API as Next.js API
    participant Redis as Redis Cache
    participant PG as PostgreSQL Container
    participant SB as Supabase Cloud
    
    Note over Mobile,SB: Data Creation Flow
    Mobile->>API: Create/Update Data
    API->>Redis: Cache Data
    API->>PG: Store Locally
    API->>SB: Sync to Cloud
    SB-->>API: Confirm Sync
    API-->>Mobile: Success Response
    
    Note over Mobile,SB: Data Retrieval Flow
    Mobile->>API: Request Data
    API->>Redis: Check Cache
    alt Cache Hit
        Redis-->>API: Return Cached Data
    else Cache Miss
        API->>SB: Query Cloud DB
        SB-->>API: Return Data
        API->>Redis: Update Cache
        API->>PG: Update Local Backup
    end
    API-->>Mobile: Return Data
    Mobile->>Mobile: Store in SQLite
```

## 🚀 **Deployment Configurations**

### **Production Environment**
```yaml
Primary: Supabase Cloud PostgreSQL
Backup: PostgreSQL Container (VPS)
Cache: Redis Container (VPS)
Mobile: SQLite (Local)
```

### **Development Environment**
```yaml
Primary: PostgreSQL Container (Local)
Backup: SQLite File (Local)
Cache: Redis Container (Local)
Mobile: SQLite (Local)
```

### **Offline/Edge Environment**
```yaml
Primary: PostgreSQL Container (Edge)
Backup: SQLite File (Local)
Cache: Redis Container (Edge)
Mobile: SQLite (Local)
```

## 📊 **Database Schema Compatibility**

All databases use the **same Prisma schema** with different providers:

```prisma
// Supabase Cloud & PostgreSQL Container
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Mobile SQLite
datasource db {
  provider = "sqlite"
  url      = "file:./tacticalops.db"
}
```

## 🔧 **Configuration Management**

### **Environment Variables**
```bash
# Supabase Cloud (Production)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# PostgreSQL Container (Backup)
DATABASE_URL=postgresql://user:pass@localhost:5432/tacticalops

# Redis Cache
REDIS_URL=redis://localhost:6379

# Mobile SQLite (Auto-configured)
MOBILE_DB_PATH=./data/tacticalops.db
```

## 🛡️ **Security & Backup Strategy**

### **Data Security**
- **Supabase**: Row Level Security (RLS) policies
- **PostgreSQL**: Role-based access control
- **SQLite**: File-level encryption
- **Redis**: Password authentication

### **Backup Strategy**
1. **Primary**: Supabase automatic backups (daily)
2. **Secondary**: PostgreSQL container backups (hourly)
3. **Tertiary**: SQLite exports (on-demand)
4. **Real-time**: Redis persistence (AOF + RDB)

## 📱 **Mobile Synchronization**

### **Offline-First Architecture**
```mermaid
graph LR
    subgraph "Mobile App"
        UI[User Interface]
        SYNC[Sync Manager]
        QUEUE[Sync Queue]
        LOCAL[SQLite Database]
    end
    
    subgraph "Cloud Services"
        API[Next.js API]
        CLOUD[Supabase Cloud]
    end
    
    UI --> LOCAL
    LOCAL --> SYNC
    SYNC --> QUEUE
    QUEUE --> API
    API --> CLOUD
    
    CLOUD --> API
    API --> SYNC
    SYNC --> LOCAL
    LOCAL --> UI
```

### **Sync Strategy**
- **Immediate**: Critical data (emergency alerts)
- **Batched**: Regular data (device status, location)
- **Background**: Analytics and logs
- **Conflict Resolution**: Last-write-wins with timestamps

## 🎯 **Performance Optimization**

### **Query Optimization**
- **Supabase**: Indexed queries with RLS
- **PostgreSQL**: Custom indexes and materialized views
- **SQLite**: WAL mode and optimized queries
- **Redis**: Pipeline operations and clustering

### **Caching Strategy**
- **L1 Cache**: Redis (seconds to minutes)
- **L2 Cache**: PostgreSQL (minutes to hours)
- **L3 Cache**: Supabase (hours to days)
- **L4 Cache**: SQLite (persistent local)

---

## 🚨 **CRITICAL IMPLEMENTATION NOTES**

1. **Never use only SQLite for production web platform**
2. **Always use Supabase Cloud as primary database**
3. **PostgreSQL container is for backup and networking only**
4. **Mobile apps use SQLite for offline-first experience**
5. **Redis is essential for session management and caching**

---

*Database Architecture documented: August 15, 2025*
*Version: 2.0.0 - Hybrid Multi-Database Architecture*