const { getRoomName, leaveRoom } = require('../state');
const { sendToSocket, sendError } = require('../utils');

const handleLeaveConversation = async (ws, data) => {
  try {
    const { conversationId } = data;
    const { role } = ws.user;

    if (!conversationId) {
      return sendError(ws, 'conversationId is required');
    }

    if (role !== 'candidate' && role !== 'agent') {
      return sendError(ws, 'Forbidden for this role');
    }

    const roomName = getRoomName(conversationId);

    if (!ws.rooms.has(roomName)) {
      return sendError(ws, 'You are not in this conversation');
    }

    leaveRoom(roomName, ws);

    sendToSocket(ws, 'LEFT_CONVERSATION', {
      conversationId
    });

  } catch (error) {
    console.error('Error in LEAVE_CONVERSATION:', error);
    sendError(ws, 'Failed to leave conversation');
  }
};

module.exports = handleLeaveConversation;
