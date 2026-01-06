const { getRoomName, getRoomSockets, addMessage } = require('../state');
const { sendError, broadcastToRoom } = require('../utils');

const handleSendMessage = async (ws, data) => {
  try {
    const { conversationId, content } = data;
    const { userId, role } = ws.user;

    if (!conversationId) {
      return sendError(ws, 'conversationId is required');
    }
    if (!content || content.trim() === '') {
      return sendError(ws, 'content is required');
    }

    const roomName = getRoomName(conversationId);
    if (!ws.rooms.has(roomName)) {
      return sendError(ws, 'You must join the conversation first');
    }

    if (role !== 'candidate' && role !== 'agent') {
      return sendError(ws, 'Forbidden for this role');
    }

    const message = {
      senderId: userId,
      senderRole: role,
      content: content.trim(),
      createdAt: new Date().toISOString()
    };

    addMessage(conversationId, message);

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
