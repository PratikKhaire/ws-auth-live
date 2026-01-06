const { getRoomName, leaveRoom } = require('../state');
const { sendToSocket, sendError } = require('../utils');

/**
 * Handle LEAVE_CONVERSATION event
 * Allowed roles: Candidate, Agent
 */
const handleLeaveConversation = async (ws, data) => {
  try {
    const { conversationId } = data;
    const { role } = ws.user;

    // Validate conversationId
    if (!conversationId) {
      return sendError(ws, 'conversationId is required');
    }

    // Only candidates and agents can leave
    if (role !== 'candidate' && role !== 'agent') {
      return sendError(ws, 'Forbidden for this role');
    }

    const roomName = getRoomName(conversationId);

    // Check if socket is in the room
    if (!ws.rooms.has(roomName)) {
      return sendError(ws, 'You are not in this conversation');
    }

    // Remove socket from room
    leaveRoom(roomName, ws);

    // Send success response
    sendToSocket(ws, 'LEFT_CONVERSATION', {
      conversationId
    });

  } catch (error) {
    console.error('Error in LEAVE_CONVERSATION:', error);
    sendError(ws, 'Failed to leave conversation');
  }
};

module.exports = handleLeaveConversation;
