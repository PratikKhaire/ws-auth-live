const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { env } = require('../config');
const { leaveAllRooms } = require('./state');
const { sendError } = require('./utils');

// Import handlers
const handleJoinConversation = require('./handlers/join.handler');
const handleSendMessage = require('./handlers/message.handler');
const handleLeaveConversation = require('./handlers/leave.handler');
const handleCloseConversation = require('./handlers/close.handler');

/**
 * Initialize WebSocket server
 * @param {http.Server} server - HTTP server instance
 */
const initWebSocket = (server) => {
  const wss = new WebSocket.Server({
    server,
    path: '/ws'
  });

  console.log('WebSocket server initialized');

  wss.on('connection', (ws, req) => {
    // Extract token from query parameter
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    // Verify JWT
    if (!token) {
      sendError(ws, 'Unauthorized or invalid token');
      ws.close();
      return;
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);

      // Attach user info to socket
      ws.user = {
        userId: decoded.userId,
        role: decoded.role
      };

      // Initialize socket metadata
      ws.rooms = new Set();

      console.log(`WebSocket connected: User ${decoded.userId} (${decoded.role})`);

    } catch (error) {
      sendError(ws, 'Unauthorized or invalid token');
      ws.close();
      return;
    }

    // Handle incoming messages
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        const { event, data: eventData } = message;

        // Validate message format
        if (!event || typeof event !== 'string') {
          return sendError(ws, 'Invalid message format');
        }

        // Route to appropriate handler
        switch (event) {
          case 'JOIN_CONVERSATION':
            await handleJoinConversation(ws, eventData || {});
            break;

          case 'SEND_MESSAGE':
            await handleSendMessage(ws, eventData || {});
            break;

          case 'LEAVE_CONVERSATION':
            await handleLeaveConversation(ws, eventData || {});
            break;

          case 'CLOSE_CONVERSATION':
            await handleCloseConversation(ws, eventData || {});
            break;

          default:
            sendError(ws, 'Unknown event');
        }

      } catch (error) {
        console.error('WebSocket message error:', error);
        sendError(ws, 'Invalid request schema');
      }
    });

    // Handle disconnect
    ws.on('close', () => {
      console.log(`WebSocket disconnected: User ${ws.user?.userId}`);

      // Remove socket from all joined rooms
      leaveAllRooms(ws);
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      leaveAllRooms(ws);
    });
  });

  return wss;
};

module.exports = { initWebSocket };
