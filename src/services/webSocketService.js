import io from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000;
  }

  // Connect to WebSocket server
  connect() {
    if (this.socket && this.isConnected) {
      console.log('WebSocket already connected');
      return;
    }

    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    const WS_URL = API_BASE_URL.replace('/api', '').replace('http', 'ws');
    
    console.log('Connecting to WebSocket:', WS_URL);

    this.socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    // Connection event handlers
    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected:', this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('connected', (data) => {
      console.log('📡 WebSocket server welcome:', data);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      this.isConnected = false;
      
      // Auto-reconnect if not manually disconnected
      if (reason !== 'io client disconnect' && this.reconnectAttempts < this.maxReconnectAttempts) {
        setTimeout(() => {
          this.reconnectAttempts++;
          console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
          this.connect();
        }, this.reconnectInterval);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
    });

    return this.socket;
  }

  // Disconnect from WebSocket server
  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting WebSocket...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Subscribe to monitoring updates for a specific hospital
  subscribeToHospitalMonitoringUpdates(hospitalId, callback) {
    if (!this.socket || !this.isConnected) {
      console.warn('WebSocket not connected. Cannot subscribe to monitoring updates.');
      return null;
    }

    const eventName = `monitoring_update_${hospitalId}`;
    this.socket.on(eventName, callback);
    
    console.log(`📊 Subscribed to monitoring updates for hospital ${hospitalId}`);
    
    // Return unsubscribe function
    return () => {
      this.socket.off(eventName, callback);
      console.log(`🔇 Unsubscribed from monitoring updates for hospital ${hospitalId}`);
    };
  }

  // Subscribe to general monitoring updates
  subscribeToMonitoringUpdates(callback) {
    if (!this.socket || !this.isConnected) {
      console.warn('WebSocket not connected. Cannot subscribe to monitoring updates.');
      return null;
    }

    this.socket.on('monitoring_update', callback);
    
    console.log('📊 Subscribed to all monitoring updates');
    
    // Return unsubscribe function
    return () => {
      this.socket.off('monitoring_update', callback);
      console.log('🔇 Unsubscribed from monitoring updates');
    };
  }

  // Subscribe to hospital status updates
  subscribeToHospitalStatusUpdates(callback) {
    if (!this.socket || !this.isConnected) {
      console.warn('WebSocket not connected. Cannot subscribe to hospital status updates.');
      return null;
    }

    this.socket.on('hospital_status_update', callback);
    
    console.log('🏥 Subscribed to hospital status updates');
    
    // Return unsubscribe function
    return () => {
      this.socket.off('hospital_status_update', callback);
      console.log('🔇 Unsubscribed from hospital status updates');
    };
  }

  // Request latest data from server
  requestLatestData() {
    if (!this.socket || !this.isConnected) {
      console.warn('WebSocket not connected. Cannot request latest data.');
      return;
    }

    console.log('📡 Requesting latest data...');
    this.socket.emit('request_latest_data');
  }

  // Subscribe to latest data response
  subscribeToLatestData(callback) {
    if (!this.socket || !this.isConnected) {
      console.warn('WebSocket not connected. Cannot subscribe to latest data.');
      return null;
    }

    this.socket.on('latest_data', callback);
    
    console.log('📊 Subscribed to latest data');
    
    // Return unsubscribe function
    return () => {
      this.socket.off('latest_data', callback);
      console.log('🔇 Unsubscribed from latest data');
    };
  }

  // Get connection status
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      socketId: this.socket?.id || null,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  // Send custom event to server
  emit(eventName, data) {
    if (!this.socket || !this.isConnected) {
      console.warn('WebSocket not connected. Cannot emit event:', eventName);
      return;
    }

    this.socket.emit(eventName, data);
  }

  // Listen to custom events from server
  on(eventName, callback) {
    if (!this.socket) {
      console.warn('WebSocket not initialized. Cannot listen to event:', eventName);
      return null;
    }

    this.socket.on(eventName, callback);
    
    // Return unsubscribe function
    return () => {
      this.socket.off(eventName, callback);
    };
  }
}

// Create singleton instance
const webSocketService = new WebSocketService();

export default webSocketService;
