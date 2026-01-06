const { getRoomName, getRoomSockets, addMessage } = require('../state');
const { sendError, broadcastToRoom } = require('../utils');

/**
 * Handle SEND_MESSAGE event
 * Allowed roles: Candidate, Agent
 */
const handleSendMessage = async (ws, data) => {
  try {
    const { conversationId, content } = data;
    const { userId, role } = ws.user;

    // Validate required fields
    if (!conversationId) {
      return sendError(ws, 'conversationId is required');
    }
    if (!content || content.trim() === '') {
      return sendError(ws, 'content is required');
    }

    // Check if socket has joined the room
    const roomName = getRoomName(conversationId);
    if (!ws.rooms.has(roomName)) {
      return sendError(ws, 'You must join the conversation first');
    }

    // Only candidates and agents can send messages
    if (role !== 'candidate' && role !== 'agent') {
      return sendError(ws, 'Forbidden for this role');
    }

    // Create message object
    const message = {
      senderId: userId,
      senderRole: role,
      content: content.trim(),
      createdAt: new Date().toISOString()
    };

    // Add message to in-memory storage
    addMessage(conversationId, message);

    // Broadcast to all sockets in the room except sender
    const roomSockets = getRoomSockets(roomName);
    broadcastToRoom(roomSockets, 'NEW_MESSAGE', {
      conversationId,
      ...message
    }, ws);

  } catch (error) {
    console.error('Error in SEND_MESSAGE:', error);
    sendError(ws, 'Failed to send message');
  }
};

module.exports = handleSendMessage;
