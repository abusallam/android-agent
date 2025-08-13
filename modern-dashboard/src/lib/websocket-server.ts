/**
 * WebSocket Server for Real-time Communication
 * Handles real-time updates for tactical operations, mapping, and system events
 */

import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { EnhancedAuth, AuthUser, PERMISSIONS } from './enhanced-auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface SocketUser extends AuthUser {
  socketId: string;
  connectedAt: Date;
  lastActivity: Date;
}

export class TacticalWebSocketServer {
  private io: SocketIOServer;
  private connectedUsers: Map<string, SocketUser> = new Map();
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds
  private operationRooms: Map<string, Set<string>> = new Map(); // operationId -> Set of socketIds

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
    this.startHeartbeat();
  }

  private setupEventHandlers() {
    this.io.on('connection', async (socket) => {
      console.log(`Socket connected: ${socket.id}`);

      // Authentication
      socket.on('authenticate', async (data) => {
        await this.handleAuthentication(socket, data);
      });

      // Tactical Operations
      socket.on('join_operation', async (data) => {
        await this.handleJoinOperation(socket, data);
      });

      socket.on('leave_operation', async (data) => {
        await this.handleLeaveOperation(socket, data);
      });

      // Map Collaboration
      socket.on('map_annotation', async (data) => {
        await this.handleMapAnnotation(socket, data);
      });

      socket.on('map_cursor', async (data) => {
        await this.handleMapCursor(socket, data);
      });

      socket.on('map_selection', async (data) => {
        await this.handleMapSelection(socket, data);
      });

      // Task Management
      socket.on('task_update', async (data) => {
        await this.handleTaskUpdate(socket, data);
      });

      socket.on('task_verification', async (data) => {
        await this.handleTaskVerification(socket, data);
      });

      // Emergency Alerts
      socket.on('emergency_alert', async (data) => {
        await this.handleEmergencyAlert(socket, data);
      });

      // Asset Tracking
      socket.on('asset_location', async (data) => {
        await this.handleAssetLocation(socket, data);
      });

      socket.on('asset_status', async (data) => {
        await this.handleAssetStatus(socket, data);
      });

      // Communication
      socket.on('voice_session', async (data) => {
        await this.handleVoiceSession(socket, data);
      });

      socket.on('chat_message', async (data) => {
        await this.handleChatMessage(socket, data);
      });

      // System Events
      socket.on('system_status', async (data) => {
        await this.handleSystemStatus(socket, data);
      });

      // Agent Events
      socket.on('agent_decision', async (data) => {
        await this.handleAgentDecision(socket, data);
      });

      // Heartbeat
      socket.on('heartbeat', () => {
        this.updateUserActivity(socket.id);
        socket.emit('heartbeat_ack', { timestamp: new Date().toISOString() });
      });

      // Disconnection
      socket.on('disconnect', () => {
        this.handleDisconnection(socket);
      });
    });
  }

  // Authentication Handler
  private async handleAuthentication(socket: any, data: { token: string }) {
    try {
      const user = await EnhancedAuth.verifyToken(data.token);
      if (!user) {
        socket.emit('auth_error', { message: 'Invalid token' });
        socket.disconnect();
        return;
      }

      const socketUser: SocketUser = {
        ...user,
        socketId: socket.id,
        connectedAt: new Date(),
        lastActivity: new Date()
      };

      this.connectedUsers.set(socket.id, socketUser);
      
      // Track user sockets
      if (!this.userSockets.has(user.id)) {
        this.userSockets.set(user.id, new Set());
      }
      this.userSockets.get(user.id)!.add(socket.id);

      // Join user to their personal room
      socket.join(`user:${user.id}`);
      
      // Join role-based rooms
      socket.join(`role:${user.role}`);
      
      // Join security tier room
      socket.join(`tier:${user.securityTier}`);

      socket.emit('authenticated', {
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          permissions: user.permissions
        },
        connectedAt: socketUser.connectedAt
      });

      // Log connection
      await this.logEvent('user_connected', {
        userId: user.id,
        username: user.username,
        socketId: socket.id
      });

      console.log(`User authenticated: ${user.username} (${socket.id})`);

    } catch (error) {
      console.error('Authentication error:', error);
      socket.emit('auth_error', { message: 'Authentication failed' });
      socket.disconnect();
    }
  }

  // Operation Management
  private async handleJoinOperation(socket: any, data: { operationId: string }) {
    const user = this.connectedUsers.get(socket.id);
    if (!user || !EnhancedAuth.hasPermission(user, PERMISSIONS.READ_OPERATIONS)) {
      socket.emit('error', { message: 'Unauthorized' });
      return;
    }

    const { operationId } = data;
    
    // Join operation room
    socket.join(`operation:${operationId}`);
    
    // Track operation participants
    if (!this.operationRooms.has(operationId)) {
      this.operationRooms.set(operationId, new Set());
    }
    this.operationRooms.get(operationId)!.add(socket.id);

    // Notify others in the operation
    socket.to(`operation:${operationId}`).emit('user_joined_operation', {
      userId: user.id,
      username: user.username,
      operationId
    });

    socket.emit('joined_operation', { operationId });

    await this.logEvent('user_joined_operation', {
      userId: user.id,
      operationId,
      socketId: socket.id
    });
  }

  private async handleLeaveOperation(socket: any, data: { operationId: string }) {
    const user = this.connectedUsers.get(socket.id);
    if (!user) return;

    const { operationId } = data;
    
    socket.leave(`operation:${operationId}`);
    
    // Remove from operation tracking
    if (this.operationRooms.has(operationId)) {
      this.operationRooms.get(operationId)!.delete(socket.id);
    }

    // Notify others
    socket.to(`operation:${operationId}`).emit('user_left_operation', {
      userId: user.id,
      username: user.username,
      operationId
    });

    socket.emit('left_operation', { operationId });
  }

  // Map Collaboration
  private async handleMapAnnotation(socket: any, data: any) {
    const user = this.connectedUsers.get(socket.id);
    if (!user || !EnhancedAuth.hasPermission(user, PERMISSIONS.READ_OPERATIONS)) {
      return;
    }

    const annotation = {
      ...data,
      userId: user.id,
      username: user.username,
      timestamp: new Date().toISOString()
    };

    // Broadcast to operation room or all users based on scope
    const room = data.operationId ? `operation:${data.operationId}` : 'authenticated';
    socket.to(room).emit('map_annotation', annotation);

    // Store annotation in database
    if (data.persist) {
      await this.storeMapAnnotation(annotation);
    }
  }

  private async handleMapCursor(socket: any, data: any) {
    const user = this.connectedUsers.get(socket.id);
    if (!user) return;

    const cursorData = {
      userId: user.id,
      username: user.username,
      position: data.position,
      timestamp: new Date().toISOString()
    };

    const room = data.operationId ? `operation:${data.operationId}` : 'authenticated';
    socket.to(room).emit('map_cursor', cursorData);
  }

  private async handleMapSelection(socket: any, data: any) {
    const user = this.connectedUsers.get(socket.id);
    if (!user) return;

    const selectionData = {
      userId: user.id,
      username: user.username,
      selection: data.selection,
      timestamp: new Date().toISOString()
    };

    const room = data.operationId ? `operation:${data.operationId}` : 'authenticated';
    socket.to(room).emit('map_selection', selectionData);
  }

  // Task Management
  private async handleTaskUpdate(socket: any, data: any) {
    const user = this.connectedUsers.get(socket.id);
    if (!user || !EnhancedAuth.hasPermission(user, PERMISSIONS.UPDATE_OPERATIONS)) {
      return;
    }

    const taskUpdate = {
      ...data,
      updatedBy: user.id,
      updatedByUsername: user.username,
      timestamp: new Date().toISOString()
    };

    // Broadcast to relevant users
    if (data.operationId) {
      this.io.to(`operation:${data.operationId}`).emit('task_updated', taskUpdate);
    } else {
      this.io.to('role:admin').emit('task_updated', taskUpdate);
    }

    await this.logEvent('task_updated', taskUpdate);
  }

  private async handleTaskVerification(socket: any, data: any) {
    const user = this.connectedUsers.get(socket.id);
    if (!user) return;

    const verification = {
      ...data,
      verifiedBy: user.id,
      verifiedByUsername: user.username,
      timestamp: new Date().toISOString()
    };

    // Broadcast to supervisors and operation participants
    this.io.to('role:admin').emit('task_verification', verification);
    if (data.operationId) {
      this.io.to(`operation:${data.operationId}`).emit('task_verification', verification);
    }

    await this.logEvent('task_verification', verification);
  }

  // Emergency Alerts
  private async handleEmergencyAlert(socket: any, data: any) {
    const user = this.connectedUsers.get(socket.id);
    if (!user || !EnhancedAuth.hasPermission(user, PERMISSIONS.CREATE_EMERGENCIES)) {
      return;
    }

    const alert = {
      ...data,
      reportedBy: user.id,
      reportedByUsername: user.username,
      timestamp: new Date().toISOString(),
      id: `alert_${Date.now()}_${Math.random().toString(36).substring(2)}`
    };

    // Broadcast emergency alert to all authenticated users
    this.io.to('authenticated').emit('emergency_alert', alert);

    // Store in database
    await this.storeEmergencyAlert(alert);

    await this.logEvent('emergency_alert_created', alert);
  }

  // Asset Tracking
  private async handleAssetLocation(socket: any, data: any) {
    const user = this.connectedUsers.get(socket.id);
    if (!user || !EnhancedAuth.hasPermission(user, PERMISSIONS.READ_ASSETS)) {
      return;
    }

    const locationUpdate = {
      ...data,
      timestamp: new Date().toISOString()
    };

    // Broadcast to operation participants and asset managers
    if (data.operationId) {
      this.io.to(`operation:${data.operationId}`).emit('asset_location', locationUpdate);
    }
    this.io.to('role:admin').emit('asset_location', locationUpdate);

    // Store location history
    await this.storeAssetLocation(locationUpdate);
  }

  private async handleAssetStatus(socket: any, data: any) {
    const user = this.connectedUsers.get(socket.id);
    if (!user || !EnhancedAuth.hasPermission(user, PERMISSIONS.READ_ASSETS)) {
      return;
    }

    const statusUpdate = {
      ...data,
      updatedBy: user.id,
      updatedByUsername: user.username,
      timestamp: new Date().toISOString()
    };

    // Broadcast asset status update
    if (data.operationId) {
      this.io.to(`operation:${data.operationId}`).emit('asset_status', statusUpdate);
    }
    this.io.to('role:admin').emit('asset_status', statusUpdate);

    await this.logEvent('asset_status_updated', statusUpdate);
  }

  // Communication
  private async handleVoiceSession(socket: any, data: any) {
    const user = this.connectedUsers.get(socket.id);
    if (!user) return;

    const sessionData = {
      ...data,
      initiatedBy: user.id,
      initiatedByUsername: user.username,
      timestamp: new Date().toISOString()
    };

    // Handle voice session signaling
    if (data.participants) {
      data.participants.forEach((participantId: string) => {
        this.io.to(`user:${participantId}`).emit('voice_session', sessionData);
      });
    }
  }

  private async handleChatMessage(socket: any, data: any) {
    const user = this.connectedUsers.get(socket.id);
    if (!user) return;

    const message = {
      ...data,
      senderId: user.id,
      senderUsername: user.username,
      timestamp: new Date().toISOString()
    };

    // Send to specific room or operation
    const room = data.operationId ? `operation:${data.operationId}` : 'authenticated';
    socket.to(room).emit('chat_message', message);

    // Store message
    await this.storeChatMessage(message);
  }

  // System Events
  private async handleSystemStatus(socket: any, data: any) {
    const user = this.connectedUsers.get(socket.id);
    if (!user || !EnhancedAuth.hasPermission(user, PERMISSIONS.SYSTEM_MONITORING)) {
      return;
    }

    // Broadcast system status to administrators
    this.io.to('role:admin').emit('system_status', {
      ...data,
      reportedBy: user.username,
      timestamp: new Date().toISOString()
    });
  }

  // Agent Events
  private async handleAgentDecision(socket: any, data: any) {
    const user = this.connectedUsers.get(socket.id);
    if (!user || user.role !== 'agent') {
      return;
    }

    const decision = {
      ...data,
      agentId: user.id,
      timestamp: new Date().toISOString()
    };

    // Broadcast agent decisions to administrators
    this.io.to('role:admin').emit('agent_decision', decision);

    await this.logEvent('agent_decision', decision);
  }

  // Utility Methods
  private updateUserActivity(socketId: string) {
    const user = this.connectedUsers.get(socketId);
    if (user) {
      user.lastActivity = new Date();
    }
  }

  private handleDisconnection(socket: any) {
    const user = this.connectedUsers.get(socket.id);
    if (user) {
      console.log(`User disconnected: ${user.username} (${socket.id})`);
      
      // Remove from tracking
      this.connectedUsers.delete(socket.id);
      
      // Remove from user sockets
      const userSockets = this.userSockets.get(user.id);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          this.userSockets.delete(user.id);
        }
      }

      // Remove from operation rooms
      this.operationRooms.forEach((sockets, operationId) => {
        if (sockets.has(socket.id)) {
          sockets.delete(socket.id);
          // Notify others in the operation
          socket.to(`operation:${operationId}`).emit('user_left_operation', {
            userId: user.id,
            username: user.username,
            operationId
          });
        }
      });

      // Log disconnection
      this.logEvent('user_disconnected', {
        userId: user.id,
        username: user.username,
        socketId: socket.id,
        sessionDuration: Date.now() - user.connectedAt.getTime()
      });
    }
  }

  private startHeartbeat() {
    setInterval(() => {
      const now = new Date();
      const timeout = 5 * 60 * 1000; // 5 minutes

      this.connectedUsers.forEach((user, socketId) => {
        if (now.getTime() - user.lastActivity.getTime() > timeout) {
          console.log(`Disconnecting inactive user: ${user.username}`);
          const socket = this.io.sockets.sockets.get(socketId);
          if (socket) {
            socket.disconnect();
          }
        }
      });
    }, 60000); // Check every minute
  }

  // Database Operations
  private async storeMapAnnotation(annotation: any) {
    try {
      await prisma.$queryRawUnsafe(`
        INSERT INTO geospatial.map_annotations (
          geometry, annotation_type, content, style, created_by, metadata
        ) VALUES (
          ST_GeomFromGeoJSON($1), $2, $3, $4, $5, $6
        )
      `,
        JSON.stringify(annotation.geometry),
        annotation.type,
        JSON.stringify(annotation.content),
        JSON.stringify(annotation.style || {}),
        annotation.userId,
        JSON.stringify({ realtime: true, socketId: annotation.socketId })
      );
    } catch (error) {
      console.error('Failed to store map annotation:', error);
    }
  }

  private async storeEmergencyAlert(alert: any) {
    try {
      await prisma.$queryRawUnsafe(`
        INSERT INTO emergency_alerts (
          alert_type, priority, description, location, reported_by, status, metadata
        ) VALUES (
          $1, $2, $3, ST_GeomFromText($4, 4326), $5, 'active', $6
        )
      `,
        alert.alertType || 'general',
        alert.priority || 'medium',
        alert.description,
        `POINT(${alert.longitude || 0} ${alert.latitude || 0})`,
        alert.reportedBy,
        JSON.stringify({ realtime: true, socketId: alert.socketId })
      );
    } catch (error) {
      console.error('Failed to store emergency alert:', error);
    }
  }

  private async storeAssetLocation(location: any) {
    try {
      await prisma.$queryRawUnsafe(`
        INSERT INTO geospatial.location_history (
          device_id, location, accuracy, altitude, speed, heading, timestamp, metadata
        ) VALUES (
          $1, ST_GeomFromText($2, 4326), $3, $4, $5, $6, NOW(), $7
        )
      `,
        location.assetId,
        `POINT(${location.longitude} ${location.latitude})`,
        location.accuracy || 10,
        location.altitude || 0,
        location.speed || 0,
        location.heading || 0,
        JSON.stringify({ realtime: true, source: 'websocket' })
      );
    } catch (error) {
      console.error('Failed to store asset location:', error);
    }
  }

  private async storeChatMessage(message: any) {
    try {
      await prisma.$queryRawUnsafe(`
        INSERT INTO system_metrics (
          metric_name, metric_value, source, tags, metadata
        ) VALUES (
          'chat_message', 1, 'websocket', $1, $2
        )
      `,
        JSON.stringify({ 
          operationId: message.operationId,
          messageType: message.type || 'text'
        }),
        JSON.stringify({
          senderId: message.senderId,
          senderUsername: message.senderUsername,
          content: message.content,
          timestamp: message.timestamp
        })
      );
    } catch (error) {
      console.error('Failed to store chat message:', error);
    }
  }

  private async logEvent(eventType: string, data: any) {
    try {
      await prisma.$queryRawUnsafe(`
        INSERT INTO system_metrics (
          metric_name, metric_value, source, tags, metadata
        ) VALUES (
          'websocket_event', 1, 'websocket_server', $1, $2
        )
      `,
        JSON.stringify({ eventType }),
        JSON.stringify({
          ...data,
          timestamp: new Date().toISOString()
        })
      );
    } catch (error) {
      console.error('Failed to log websocket event:', error);
    }
  }

  // Public API
  public getConnectedUsers(): SocketUser[] {
    return Array.from(this.connectedUsers.values());
  }

  public getUserCount(): number {
    return this.connectedUsers.size;
  }

  public getOperationParticipants(operationId: string): SocketUser[] {
    const socketIds = this.operationRooms.get(operationId) || new Set();
    return Array.from(socketIds)
      .map(socketId => this.connectedUsers.get(socketId))
      .filter(user => user !== undefined) as SocketUser[];
  }

  public broadcastToOperation(operationId: string, event: string, data: any) {
    this.io.to(`operation:${operationId}`).emit(event, data);
  }

  public broadcastToRole(role: string, event: string, data: any) {
    this.io.to(`role:${role}`).emit(event, data);
  }

  public broadcastToAll(event: string, data: any) {
    this.io.emit(event, data);
  }

  public sendToUser(userId: string, event: string, data: any) {
    this.io.to(`user:${userId}`).emit(event, data);
  }
}

// Export singleton instance
let wsServer: TacticalWebSocketServer | null = null;

export function initializeWebSocketServer(server: HTTPServer): TacticalWebSocketServer {
  if (!wsServer) {
    wsServer = new TacticalWebSocketServer(server);
  }
  return wsServer;
}

export function getWebSocketServer(): TacticalWebSocketServer | null {
  return wsServer;
}