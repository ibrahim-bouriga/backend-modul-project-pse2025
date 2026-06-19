import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { MQTTClientWrapper, MQTT_TOPICS } from './mqtt-client.js';

/**
 * WebSocket Server using Socket.IO
 * Bridges MQTT messages to WebSocket clients for real-time updates
 */

export interface WebSocketServer {
  io: SocketIOServer;
  initialize: (mqttClient: MQTTClientWrapper) => void;
}

/**
 * Initialize Socket.IO server and bridge MQTT messages
 */
export function createWebSocketServer(httpServer: HTTPServer): WebSocketServer {
  // Create Socket.IO server with CORS configuration
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    // Connection options
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  console.log('[WebSocket] Socket.IO server created');

  /**
   * Initialize WebSocket server and bridge MQTT messages
   */
  function initialize(mqttClient: MQTTClientWrapper): void {
    console.log('[WebSocket] Initializing WebSocket-MQTT bridge');

    // Handle client connections
    io.on('connection', (socket: Socket) => {
      console.log(`[WebSocket] Client connected: ${socket.id}`);

      // Send connection confirmation
      socket.emit('connected', {
        message: 'Connected to PSE Backend WebSocket',
        timestamp: new Date().toISOString(),
      });

      // Handle room subscriptions
      socket.on('subscribe', (room: string) => {
        console.log(`[WebSocket] Client ${socket.id} subscribing to room: ${room}`);
        socket.join(room);
        socket.emit('subscribed', { room, timestamp: new Date().toISOString() });
      });

      socket.on('unsubscribe', (room: string) => {
        console.log(`[WebSocket] Client ${socket.id} unsubscribing from room: ${room}`);
        socket.leave(room);
        socket.emit('unsubscribed', { room, timestamp: new Date().toISOString() });
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        console.log(`[WebSocket] Client disconnected: ${socket.id}, reason: ${reason}`);
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error(`[WebSocket] Socket error for ${socket.id}:`, error);
      });
    });

    // Bridge MQTT messages to WebSocket rooms
    setupMQTTBridge(mqttClient, io);

    console.log('[WebSocket] WebSocket-MQTT bridge initialized');
  }

  return { io, initialize };
}

/**
 * Setup MQTT to WebSocket bridge
 * Forwards MQTT messages to appropriate WebSocket rooms
 */
function setupMQTTBridge(mqttClient: MQTTClientWrapper, io: SocketIOServer): void {
  console.log('[WebSocket Bridge] Setting up MQTT to WebSocket bridge');

  // Bridge Super Car GPS updates
  mqttClient.subscribe(MQTT_TOPICS.SUPERCAR_GPS, (topic, payload) => {
    try {
      console.log('[WebSocket Bridge] Broadcasting super car GPS to room: supercar');
      
      // Broadcast to 'supercar' room
      io.to('supercar').emit('supercar:gps', payload);
      
      // Also broadcast to general 'world-drive' room
      io.to('world-drive').emit('supercar:gps', payload);
    } catch (error) {
      console.error('[WebSocket Bridge] Error broadcasting super car GPS:', error);
    }
  });

  // Bridge Super Car Status updates
  mqttClient.subscribe(MQTT_TOPICS.SUPERCAR_STATUS, (message) => {
    try {
      const payload = JSON.parse(message.toString());
      console.log('[WebSocket Bridge] Broadcasting super car status');
      
      io.to('supercar').emit('supercar:status', payload);
      io.to('world-drive').emit('supercar:status', payload);
    } catch (error) {
      console.error('[WebSocket Bridge] Error broadcasting super car status:', error);
    }
  });

  // Bridge Vehicle GPS updates (dynamic vehicle IDs)
  // Subscribe to wildcard topic for all vehicles
  mqttClient.subscribe('car/+/gps', (message, topic) => {
    try {
      const payload = JSON.parse(message.toString());
      
      // Extract vehicle ID from topic (car/{vehicleId}/gps)
      const vehicleId = topic.split('/')[1];
      console.log(`[WebSocket Bridge] Broadcasting vehicle ${vehicleId} GPS`);
      
      // Broadcast to vehicle-specific room
      io.to(`vehicle:${vehicleId}`).emit('vehicle:gps', {
        vehicleId,
        ...payload,
      });
      
      // Also broadcast to general 'mypsecar' room
      io.to('mypsecar').emit('vehicle:gps', {
        vehicleId,
        ...payload,
      });
    } catch (error) {
      console.error('[WebSocket Bridge] Error broadcasting vehicle GPS:', error);
    }
  });

  // Bridge Vehicle Fuel updates
  mqttClient.subscribe('car/+/fuel', (message, topic) => {
    try {
      const payload = JSON.parse(message.toString());
      const vehicleId = topic.split('/')[1];
      console.log(`[WebSocket Bridge] Broadcasting vehicle ${vehicleId} fuel`);
      
      io.to(`vehicle:${vehicleId}`).emit('vehicle:fuel', {
        vehicleId,
        ...payload,
      });
      
      io.to('mypsecar').emit('vehicle:fuel', {
        vehicleId,
        ...payload,
      });
    } catch (error) {
      console.error('[WebSocket Bridge] Error broadcasting vehicle fuel:', error);
    }
  });

  // Bridge Vehicle Speed updates
  mqttClient.subscribe('car/+/speed', (message, topic) => {
    try {
      const payload = JSON.parse(message.toString());
      const vehicleId = topic.split('/')[1];
      console.log(`[WebSocket Bridge] Broadcasting vehicle ${vehicleId} speed`);
      
      io.to(`vehicle:${vehicleId}`).emit('vehicle:speed', {
        vehicleId,
        ...payload,
      });
      
      io.to('mypsecar').emit('vehicle:speed', {
        vehicleId,
        ...payload,
      });
    } catch (error) {
      console.error('[WebSocket Bridge] Error broadcasting vehicle speed:', error);
    }
  });

  // Bridge Vehicle Status updates
  mqttClient.subscribe('car/+/status', (message, topic) => {
    try {
      const payload = JSON.parse(message.toString());
      const vehicleId = topic.split('/')[1];
      console.log(`[WebSocket Bridge] Broadcasting vehicle ${vehicleId} status`);
      
      io.to(`vehicle:${vehicleId}`).emit('vehicle:status', {
        vehicleId,
        ...payload,
      });
      
      io.to('mypsecar').emit('vehicle:status', {
        vehicleId,
        ...payload,
      });
    } catch (error) {
      console.error('[WebSocket Bridge] Error broadcasting vehicle status:', error);
    }
  });

  // Bridge Car Configurator control messages
  mqttClient.subscribe(MQTT_TOPICS.CONFIGURATOR_CONTROL, (message) => {
    try {
      const payload = JSON.parse(message.toString());
      console.log('[WebSocket Bridge] Broadcasting configurator control');
      
      io.to('configurator').emit('configurator:control', payload);
    } catch (error) {
      console.error('[WebSocket Bridge] Error broadcasting configurator control:', error);
    }
  });

  // Bridge Car Configurator telemetry
  mqttClient.subscribe(MQTT_TOPICS.CONFIGURATOR_TELEMETRY, (message) => {
    try {
      const payload = JSON.parse(message.toString());
      console.log('[WebSocket Bridge] Broadcasting configurator telemetry');
      
      io.to('configurator').emit('configurator:telemetry', payload);
    } catch (error) {
      console.error('[WebSocket Bridge] Error broadcasting configurator telemetry:', error);
    }
  });

  console.log('[WebSocket Bridge] MQTT to WebSocket bridge setup complete');
}
