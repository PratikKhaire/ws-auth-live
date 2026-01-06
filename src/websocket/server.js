const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { env } = require('../config');
const { leaveAllRooms } = require('./state');
const { sendError } = require('./utils');

const handleJoinConversation = require('./handlers/join.handler');
const handleSendMessage = require('./handlers/message.handler');
const handleLeaveConversation = require('./handlers/leave.handler');
const handleCloseConversation = require('./handlers/close.handler');

const initWebSocket = (server) => {
  const wss = new WebSocket.Server({
    server,
    path: '/ws'
  });

  console.log('WebSocket server initialized');

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
      sendError(ws, 'Unauthorized or invalid token');
      ws.close();
      return;
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);

      ws.user = {
        userId: decoded.userId,
        role: decoded.role
      };

      ws.rooms = new Set();

      console.log(`WebSocket connected: User ${decoded.userId} (${decoded.role})`);

    } catch (error) {
      sendError(ws, 'Unauthorized or invalid token');
      ws.close();
      return;
    }

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        const { event, data: eventData } = message;

        if (!event || typeof event !== 'string') {
          return sendError(ws, 'Invalid message format');
        }

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

    ws.on('close', () => {
      console.log(`WebSocket disconnected: User ${ws.user?.userId}`);
      leaveAllRooms(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      leaveAllRooms(ws);
    });
  });

  return wss;
};

module.exports = { initWebSocket };
