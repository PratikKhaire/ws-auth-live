const { Conversation } = require('../../models');
const { joinRoom, getRoomName, initConversationMessages } = require('../state');
const { sendToSocket, sendError } = require('../utils');

const handleJoinConversation = async (ws, data) => {
  try {
    const { conversationId } = data;
    const { userId, role } = ws.user;

    if (!conversationId) {
      return sendError(ws, 'conversationId is required');
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return sendError(ws, 'Conversation not found');
    }

    if (conversation.status === 'closed') {
      return sendError(ws, 'Conversation already closed');
    }

    const roomName = getRoomName(conversationId);

    if (role === 'candidate') {
      if (conversation.candidateId.toString() !== userId) {
        return sendError(ws, 'not allowed');
      }

      joinRoom(roomName, ws);
      initConversationMessages(conversationId);

      sendToSocket(ws, 'JOINED_CONVERSATION', {
        conversationId,
        status: conversation.status
      });

    } else if (role === 'agent') {
      if (!conversation.agentId || conversation.agentId.toString() !== userId) {
        return sendError(ws, 'not allowed');
      }

      if (conversation.status === 'open') {
        conversation.status = 'assigned';
        await conversation.save();
      }

      joinRoom(roomName, ws);
      initConversationMessages(conversationId);

      sendToSocket(ws, 'JOINED_CONVERSATION', {
        conversationId,
        status: 'assigned'
      });

    } else {
      return sendError(ws, 'Forbidden for this role');
    }

  } catch (error) {
    console.error('Error in JOIN_CONVERSATION:', error);
    sendError(ws, 'Failed to join conversation');
  }
};

module.exports = handleJoinConversation;
