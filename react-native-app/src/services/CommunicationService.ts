import { supabase, TABLES, TacticalMessage, TacticalChannel } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

export interface MediaFile {
  id: string;
  name: string;
  type: 'image' | 'video' | 'audio' | 'document';
  uri: string;
  size: number;
  mimeType: string;
  thumbnail?: string;
}

export interface MessageAttachment {
  id: string;
  messageId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
  thumbnailPath?: string;
}

export interface CommunicationCallbacks {
  onMessageReceived?: (message: TacticalMessage) => void;
  onMessageUpdated?: (message: TacticalMessage) => void;
  onMessageDeleted?: (messageId: string) => void;
  onTypingStart?: (userId: string, channelId: string) => void;
  onTypingStop?: (userId: string, channelId: string) => void;
  onUserOnline?: (userId: string) => void;
  onUserOffline?: (userId: string) => void;
}

export class CommunicationService {
  private channels: RealtimeChannel[] = [];
  private callbacks: CommunicationCallbacks = {};
  private currentUserId: string | null = null;
  private activeChannels: Set<string> = new Set();
  private typingUsers: Map<string, Set<string>> = new Map(); // channelId -> Set of userIds

  constructor() {
    this.initializeUser();
  }

  private async initializeUser() {
    const { data: { user } } = await supabase.auth.getUser();
    this.currentUserId = user?.id || null;
  }

  // Initialize communication service with callbacks
  async initialize(callbacks: CommunicationCallbacks = {}) {
    this.callbacks = callbacks;
    await this.setupGlobalSubscriptions();
  }

  // Join a communication channel
  async joinChannel(channelId: string) {
    if (this.activeChannels.has(channelId)) return;

    try {
      this.activeChannels.add(channelId);
      await this.setupChannelSubscription(channelId);
      console.log(`Joined channel: ${channelId}`);
    } catch (error) {
      console.error('Error joining channel:', error);
      this.activeChannels.delete(channelId);
      throw error;
    }
  }

  // Leave a communication channel
  async leaveChannel(channelId: string) {
    if (!this.activeChannels.has(channelId)) return;

    try {
      // Find and unsubscribe from the channel
      const channelIndex = this.channels.findIndex(ch => 
        ch.topic.includes(channelId)
      );
      
      if (channelIndex >= 0) {
        await this.channels[channelIndex].unsubscribe();
        this.channels.splice(channelIndex, 1);
      }

      this.activeChannels.delete(channelId);
      this.typingUsers.delete(channelId);
      
      console.log(`Left channel: ${channelId}`);
    } catch (error) {
      console.error('Error leaving channel:', error);
    }
  }

  // Send a text message
  async sendMessage(
    channelId: string, 
    content: string, 
    options: {
      replyTo?: string;
      includeLocation?: boolean;
      isEncrypted?: boolean;
    } = {}
  ): Promise<TacticalMessage> {
    try {
      const profile = await this.getCurrentProfile();
      if (!profile) {
        throw new Error('User profile not found');
      }

      let location = null;
      if (options.includeLocation) {
        const locationData = await this.getCurrentLocation();
        if (locationData) {
          location = `POINT(${locationData.longitude} ${locationData.latitude})`;
        }
      }

      const messageData = {
        channel_id: channelId,
        sender_id: profile.id,
        content: options.isEncrypted ? await this.encryptMessage(content) : content,
        message_type: 'text' as const,
        location,
        reply_to: options.replyTo,
        is_encrypted: options.isEncrypted || false,
        metadata: {}
      };

      const { data, error } = await supabase
        .from(TABLES.MESSAGES)
        .insert(messageData)
        .select(`
          *,
          sender:tactical_profiles(*),
          reply_to_message:tactical_messages(*)
        `)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Send a media message (image, video, audio)
  async sendMediaMessage(
    channelId: string,
    mediaFile: MediaFile,
    options: {
      caption?: string;
      includeLocation?: boolean;
      isEncrypted?: boolean;
    } = {}
  ): Promise<TacticalMessage> {
    try {
      const profile = await this.getCurrentProfile();
      if (!profile) {
        throw new Error('User profile not found');
      }

      // Upload media file to Supabase Storage
      const storagePath = await this.uploadMediaFile(mediaFile);
      
      let location = null;
      if (options.includeLocation) {
        const locationData = await this.getCurrentLocation();
        if (locationData) {
          location = `POINT(${locationData.longitude} ${locationData.latitude})`;
        }
      }

      // Create message
      const messageData = {
        channel_id: channelId,
        sender_id: profile.id,
        content: options.caption || '',
        message_type: mediaFile.type as any,
        location,
        is_encrypted: options.isEncrypted || false,
        metadata: {
          fileName: mediaFile.name,
          fileSize: mediaFile.size,
          mimeType: mediaFile.mimeType
        }
      };

      const { data: message, error: messageError } = await supabase
        .from(TABLES.MESSAGES)
        .insert(messageData)
        .select(`
          *,
          sender:tactical_profiles(*)
        `)
        .single();

      if (messageError) throw messageError;

      // Create attachment record
      const { error: attachmentError } = await supabase
        .from(TABLES.MESSAGE_ATTACHMENTS)
        .insert({
          message_id: message.id,
          file_name: mediaFile.name,
          file_type: mediaFile.mimeType,
          file_size: mediaFile.size,
          storage_path: storagePath,
          thumbnail_path: mediaFile.thumbnail
        });

      if (attachmentError) {
        console.error('Error creating attachment record:', attachmentError);
      }

      return message;
    } catch (error) {
      console.error('Error sending media message:', error);
      throw error;
    }
  }

  // Send location message
  async sendLocationMessage(
    channelId: string,
    coordinates: { latitude: number; longitude: number },
    options: {
      caption?: string;
      accuracy?: number;
    } = {}
  ): Promise<TacticalMessage> {
    try {
      const profile = await this.getCurrentProfile();
      if (!profile) {
        throw new Error('User profile not found');
      }

      const messageData = {
        channel_id: channelId,
        sender_id: profile.id,
        content: options.caption || 'Shared location',
        message_type: 'location' as const,
        location: `POINT(${coordinates.longitude} ${coordinates.latitude})`,
        is_encrypted: false,
        metadata: {
          accuracy: options.accuracy
        }
      };

      const { data, error } = await supabase
        .from(TABLES.MESSAGES)
        .insert(messageData)
        .select(`
          *,
          sender:tactical_profiles(*)
        `)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error sending location message:', error);
      throw error;
    }
  }

  // Get messages for a channel
  async getChannelMessages(
    channelId: string,
    options: {
      limit?: number;
      before?: string; // message ID
      after?: string; // message ID
    } = {}
  ): Promise<TacticalMessage[]> {
    try {
      let query = supabase
        .from(TABLES.MESSAGES)
        .select(`
          *,
          sender:tactical_profiles(*),
          reply_to_message:tactical_messages(*),
          attachments:tactical_message_attachments(*)
        `)
        .eq('channel_id', channelId)
        .order('created_at', { ascending: false });

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.before) {
        const { data: beforeMessage } = await supabase
          .from(TABLES.MESSAGES)
          .select('created_at')
          .eq('id', options.before)
          .single();
        
        if (beforeMessage) {
          query = query.lt('created_at', beforeMessage.created_at);
        }
      }

      if (options.after) {
        const { data: afterMessage } = await supabase
          .from(TABLES.MESSAGES)
          .select('created_at')
          .eq('id', options.after)
          .single();
        
        if (afterMessage) {
          query = query.gt('created_at', afterMessage.created_at);
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting channel messages:', error);
      return [];
    }
  }

  // Create a new channel
  async createChannel(
    name: string,
    options: {
      description?: string;
      channelType?: string;
      teamId?: string;
      sessionId?: string;
      isPrivate?: boolean;
    } = {}
  ): Promise<TacticalChannel> {
    try {
      const profile = await this.getCurrentProfile();
      if (!profile) {
        throw new Error('User profile not found');
      }

      const { data, error } = await supabase
        .from(TABLES.CHANNELS)
        .insert({
          name,
          description: options.description,
          channel_type: options.channelType || 'text',
          team_id: options.teamId,
          session_id: options.sessionId,
          is_private: options.isPrivate || false,
          created_by: profile.id
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error creating channel:', error);
      throw error;
    }
  }

  // Start typing indicator
  async startTyping(channelId: string) {
    if (!this.currentUserId) return;

    try {
      // Send typing event through realtime
      const channel = this.channels.find(ch => ch.topic.includes(channelId));
      if (channel) {
        await channel.send({
          type: 'broadcast',
          event: 'typing_start',
          payload: {
            user_id: this.currentUserId,
            channel_id: channelId,
            timestamp: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      console.error('Error starting typing:', error);
    }
  }

  // Stop typing indicator
  async stopTyping(channelId: string) {
    if (!this.currentUserId) return;

    try {
      const channel = this.channels.find(ch => ch.topic.includes(channelId));
      if (channel) {
        await channel.send({
          type: 'broadcast',
          event: 'typing_stop',
          payload: {
            user_id: this.currentUserId,
            channel_id: channelId,
            timestamp: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      console.error('Error stopping typing:', error);
    }
  }

  // Pick and prepare media file
  async pickMediaFile(type: 'image' | 'video' | 'camera'): Promise<MediaFile | null> {
    try {
      let result;

      switch (type) {
        case 'image':
          result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
            exif: true
          });
          break;
        
        case 'video':
          result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
            allowsEditing: true,
            quality: 0.8
          });
          break;
        
        case 'camera':
          result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsEditing: true,
            quality: 0.8,
            exif: true
          });
          break;
      }

      if (result.canceled || !result.assets[0]) {
        return null;
      }

      const asset = result.assets[0];
      const fileInfo = await FileSystem.getInfoAsync(asset.uri);

      return {
        id: Date.now().toString(),
        name: asset.fileName || `media_${Date.now()}`,
        type: asset.type === 'video' ? 'video' : 'image',
        uri: asset.uri,
        size: fileInfo.size || 0,
        mimeType: asset.mimeType || 'image/jpeg'
      };
    } catch (error) {
      console.error('Error picking media file:', error);
      return null;
    }
  }

  // Private helper methods
  private async getCurrentProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from(TABLES.PROFILES)
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data;
  }

  private async getCurrentLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return null;

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy
      };
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    }
  }

  private async uploadMediaFile(mediaFile: MediaFile): Promise<string> {
    try {
      // Read file as blob
      const response = await fetch(mediaFile.uri);
      const blob = await response.blob();

      // Generate unique file path
      const fileExtension = mediaFile.name.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`;
      const filePath = `media/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('tactical-media')
        .upload(filePath, blob, {
          contentType: mediaFile.mimeType,
          upsert: false
        });

      if (error) throw error;

      return data.path;
    } catch (error) {
      console.error('Error uploading media file:', error);
      throw error;
    }
  }

  private async encryptMessage(content: string): Promise<string> {
    // Implement message encryption here
    // For now, return the content as-is
    return content;
  }

  private async setupGlobalSubscriptions() {
    // Set up global presence and user status subscriptions
    const presenceChannel = supabase
      .channel('global-presence')
      .on('presence', { event: 'sync' }, () => {
        // Handle presence sync
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        this.callbacks.onUserOnline?.(key);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        this.callbacks.onUserOffline?.(key);
      })
      .subscribe();

    this.channels.push(presenceChannel);
  }

  private async setupChannelSubscription(channelId: string) {
    // Subscribe to messages in this channel
    const messagesChannel = supabase
      .channel(`messages-${channelId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: TABLES.MESSAGES,
        filter: `channel_id=eq.${channelId}`
      }, (payload) => {
        this.handleMessageEvent('INSERT', payload.new);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: TABLES.MESSAGES,
        filter: `channel_id=eq.${channelId}`
      }, (payload) => {
        this.handleMessageEvent('UPDATE', payload.new);
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: TABLES.MESSAGES,
        filter: `channel_id=eq.${channelId}`
      }, (payload) => {
        this.handleMessageEvent('DELETE', payload.old);
      })
      .on('broadcast', { event: 'typing_start' }, (payload) => {
        this.handleTypingEvent('start', payload.payload);
      })
      .on('broadcast', { event: 'typing_stop' }, (payload) => {
        this.handleTypingEvent('stop', payload.payload);
      })
      .subscribe();

    this.channels.push(messagesChannel);
  }

  private async handleMessageEvent(eventType: string, messageData: any) {
    // Don't process our own messages
    if (messageData.sender_id === this.currentUserId) return;

    try {
      // Fetch complete message data with relations
      const { data: fullMessage, error } = await supabase
        .from(TABLES.MESSAGES)
        .select(`
          *,
          sender:tactical_profiles(*),
          reply_to_message:tactical_messages(*),
          attachments:tactical_message_attachments(*)
        `)
        .eq('id', messageData.id)
        .single();

      if (error) throw error;

      switch (eventType) {
        case 'INSERT':
          this.callbacks.onMessageReceived?.(fullMessage);
          break;
        case 'UPDATE':
          this.callbacks.onMessageUpdated?.(fullMessage);
          break;
        case 'DELETE':
          this.callbacks.onMessageDeleted?.(messageData.id);
          break;
      }
    } catch (error) {
      console.error('Error handling message event:', error);
    }
  }

  private handleTypingEvent(eventType: 'start' | 'stop', payload: any) {
    const { user_id, channel_id } = payload;
    
    if (user_id === this.currentUserId) return;

    if (!this.typingUsers.has(channel_id)) {
      this.typingUsers.set(channel_id, new Set());
    }

    const channelTypingUsers = this.typingUsers.get(channel_id)!;

    if (eventType === 'start') {
      channelTypingUsers.add(user_id);
      this.callbacks.onTypingStart?.(user_id, channel_id);
    } else {
      channelTypingUsers.delete(user_id);
      this.callbacks.onTypingStop?.(user_id, channel_id);
    }
  }

  // Cleanup
  async cleanup() {
    for (const channel of this.channels) {
      await channel.unsubscribe();
    }
    this.channels = [];
    this.activeChannels.clear();
    this.typingUsers.clear();
  }

  // Add emoji reaction to a message
  async addReaction(messageId: string, emoji: string): Promise<void> {
    try {
      const profile = await this.getCurrentProfile();
      if (!profile) {
        throw new Error('User profile not found');
      }

      const { error } = await supabase
        .from('tactical_message_reactions')
        .upsert([{
          message_id: messageId,
          user_id: profile.id,
          emoji,
        }], {
          onConflict: 'message_id,user_id,emoji'
        });

      if (error) throw error;

      this.emit('reactionAdded', { messageId, emoji, userId: profile.id });
    } catch (error) {
      console.error('Error adding reaction:', error);
      throw error;
    }
  }

  // Remove emoji reaction from a message
  async removeReaction(messageId: string, emoji: string): Promise<void> {
    try {
      const profile = await this.getCurrentProfile();
      if (!profile) {
        throw new Error('User profile not found');
      }

      const { error } = await supabase
        .from('tactical_message_reactions')
        .delete()
        .match({
          message_id: messageId,
          user_id: profile.id,
          emoji,
        });

      if (error) throw error;

      this.emit('reactionRemoved', { messageId, emoji, userId: profile.id });
    } catch (error) {
      console.error('Error removing reaction:', error);
      throw error;
    }
  }

  // Get reactions for a message
  async getMessageReactions(messageId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('tactical_message_reactions')
        .select(`
          *,
          user:tactical_profiles(id, username, full_name, avatar_url)
        `)
        .eq('message_id', messageId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting message reactions:', error);
      return [];
    }
  }

  // Start a message thread
  async startThread(parentMessageId: string, threadName?: string): Promise<string> {
    try {
      const profile = await this.getCurrentProfile();
      if (!profile) {
        throw new Error('User profile not found');
      }

      const { data, error } = await supabase
        .from('tactical_message_threads')
        .insert({
          parent_message_id: parentMessageId,
          thread_name: threadName,
          created_by: profile.id,
        })
        .select()
        .single();

      if (error) throw error;

      return data.id;
    } catch (error) {
      console.error('Error starting thread:', error);
      throw error;
    }
  }

  // Send a threaded reply
  async sendThreadReply(
    channelId: string,
    threadId: string,
    content: string,
    options: {
      includeLocation?: boolean;
      isEncrypted?: boolean;
    } = {}
  ): Promise<TacticalMessage> {
    try {
      const profile = await this.getCurrentProfile();
      if (!profile) {
        throw new Error('User profile not found');
      }

      let location = null;
      if (options.includeLocation) {
        const locationData = await this.getCurrentLocation();
        if (locationData) {
          location = `POINT(${locationData.longitude} ${locationData.latitude})`;
        }
      }

      const messageData = {
        channel_id: channelId,
        sender_id: profile.id,
        content: options.isEncrypted ? await this.encryptMessage(content) : content,
        message_type: 'text' as const,
        location,
        is_encrypted: options.isEncrypted || false,
        metadata: {
          threadId,
          isThreadReply: true,
        }
      };

      const { data, error } = await supabase
        .from(TABLES.MESSAGES)
        .insert(messageData)
        .select(`
          *,
          sender:tactical_profiles(*)
        `)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error sending thread reply:', error);
      throw error;
    }
  }

  // Get thread messages
  async getThreadMessages(threadId: string, limit: number = 50): Promise<TacticalMessage[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.MESSAGES)
        .select(`
          *,
          sender:tactical_profiles(*),
          attachments:tactical_message_attachments(*)
        `)
        .eq('metadata->>threadId', threadId)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting thread messages:', error);
      return [];
    }
  }

  // Search messages
  async searchMessages(
    query: string,
    options: {
      channelId?: string;
      limit?: number;
      before?: Date;
      after?: Date;
    } = {}
  ): Promise<TacticalMessage[]> {
    try {
      let searchQuery = supabase
        .from('tactical_message_search')
        .select(`
          message_id,
          tactical_messages!inner(
            *,
            sender:tactical_profiles(*),
            attachments:tactical_message_attachments(*)
          )
        `)
        .textSearch('search_vector', query, {
          type: 'websearch',
          config: 'english'
        });

      if (options.channelId) {
        searchQuery = searchQuery.eq('tactical_messages.channel_id', options.channelId);
      }

      if (options.before) {
        searchQuery = searchQuery.lt('tactical_messages.created_at', options.before.toISOString());
      }

      if (options.after) {
        searchQuery = searchQuery.gt('tactical_messages.created_at', options.after.toISOString());
      }

      if (options.limit) {
        searchQuery = searchQuery.limit(options.limit);
      }

      const { data, error } = await searchQuery
        .order('tactical_messages.created_at', { ascending: false });

      if (error) throw error;

      return data?.map(item => item.tactical_messages) || [];
    } catch (error) {
      console.error('Error searching messages:', error);
      return [];
    }
  }

  // Get message history with advanced filtering
  async getMessageHistory(
    channelId: string,
    options: {
      limit?: number;
      before?: Date;
      after?: Date;
      messageType?: string;
      senderId?: string;
      hasAttachments?: boolean;
      hasLocation?: boolean;
    } = {}
  ): Promise<TacticalMessage[]> {
    try {
      let query = supabase
        .from(TABLES.MESSAGES)
        .select(`
          *,
          sender:tactical_profiles(*),
          attachments:tactical_message_attachments(*),
          reactions:tactical_message_reactions(
            emoji,
            user:tactical_profiles(id, username, full_name, avatar_url)
          )
        `)
        .eq('channel_id', channelId);

      if (options.messageType) {
        query = query.eq('message_type', options.messageType);
      }

      if (options.senderId) {
        query = query.eq('sender_id', options.senderId);
      }

      if (options.hasAttachments) {
        query = query.not('attachments', 'is', null);
      }

      if (options.hasLocation) {
        query = query.not('location', 'is', null);
      }

      if (options.before) {
        query = query.lt('created_at', options.before.toISOString());
      }

      if (options.after) {
        query = query.gt('created_at', options.after.toISOString());
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting message history:', error);
      return [];
    }
  }

  // Mark messages as read
  async markMessagesAsRead(channelId: string, messageIds: string[]): Promise<void> {
    try {
      const profile = await this.getCurrentProfile();
      if (!profile) return;

      // This would typically update a read_receipts table
      // For now, we'll emit an event
      this.emit('messagesRead', { channelId, messageIds, userId: profile.id });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  // Get channel statistics
  async getChannelStats(channelId: string): Promise<{
    totalMessages: number;
    totalParticipants: number;
    messagesByType: Record<string, number>;
    topSenders: Array<{ userId: string; username: string; count: number }>;
  }> {
    try {
      // Get total messages
      const { count: totalMessages } = await supabase
        .from(TABLES.MESSAGES)
        .select('*', { count: 'exact', head: true })
        .eq('channel_id', channelId);

      // Get messages by type
      const { data: messageTypes } = await supabase
        .from(TABLES.MESSAGES)
        .select('message_type')
        .eq('channel_id', channelId);

      const messagesByType = messageTypes?.reduce((acc, msg) => {
        acc[msg.message_type] = (acc[msg.message_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Get top senders
      const { data: senderData } = await supabase
        .from(TABLES.MESSAGES)
        .select(`
          sender_id,
          sender:tactical_profiles(username)
        `)
        .eq('channel_id', channelId);

      const senderCounts = senderData?.reduce((acc, msg) => {
        const senderId = msg.sender_id;
        if (!acc[senderId]) {
          acc[senderId] = {
            userId: senderId,
            username: msg.sender?.username || 'Unknown',
            count: 0
          };
        }
        acc[senderId].count++;
        return acc;
      }, {} as Record<string, any>) || {};

      const topSenders = Object.values(senderCounts)
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 10);

      return {
        totalMessages: totalMessages || 0,
        totalParticipants: 0, // Would need to implement participant tracking
        messagesByType,
        topSenders,
      };
    } catch (error) {
      console.error('Error getting channel stats:', error);
      return {
        totalMessages: 0,
        totalParticipants: 0,
        messagesByType: {},
        topSenders: [],
      };
    }
  }

  // Private helper to emit events
  private emit(event: string, data: any): void {
    // Simple event emitter implementation
    console.log(`Event: ${event}`, data);
  }

  // Public getters
  get activeChannelIds(): string[] {
    return Array.from(this.activeChannels);
  }

  getTypingUsers(channelId: string): string[] {
    return Array.from(this.typingUsers.get(channelId) || []);
  }
}

export default CommunicationService;