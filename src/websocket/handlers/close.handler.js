const { Conversation, Message } = require('../../models');
const {
  getRoomName,
  getRoomSockets,
  getConversationMessages,
  clearConversationMessages,
  deleteRoom
} = require('../state');
const { sendToSocket, sendError, broadcastToRoom } = require('../utils');

const handleCloseConversation = async (ws, data) => {
  try {
    const { conversationId } = data;
    const { userId, role } = ws.user;

    if (!conversationId) {
      return sendError(ws, 'conversationId is required');
    }

    if (role !== 'agent') {
      return sendError(ws, 'Forbidden for this role');
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return sendError(ws, 'Conversation not found');
    }

    if (!conversation.agentId || conversation.agentId.toString() !== userId) {
      return sendError(ws, 'not allowed');
    }

    if (conversation.status === 'open') {
      return sendError(ws, 'Conversation not yet assigned');
    }
    if (conversation.status === 'closed') {
      return sendError(ws, 'Conversation already closed');
    }

    const roomName = getRoomName(conversationId);

    const messages = getConversationMessages(conversationId);

    if (messages.length > 0) {
      const messageDocuments = messages.map(msg => ({
        conversationId,
        senderId: msg.senderId,
        senderRole: msg.senderRole,
        content: msg.content,
        createdAt: new Date(msg.createdAt)
      }));

      await Message.insertMany(messageDocuments);
    }

    conversation.status = 'closed';
    conversation.closedAt = new Date();
    await conversation.save();

    const roomSockets = getRoomSockets(roomName);
    broadcastToRoom(roomSockets, 'CONVERSATION_CLOSED', {
      conversationId
    }, ws);

    sendToSocket(ws, 'CONVERSATION_CLOSED', {
      conversationId
    });

    deleteRoom(roomName);

    clearConversationMessages(conversationId);

  } catch (error) {
    console.error('Error in CLOSE_CONVERSATION:', error);
    sendError(ws, 'Failed to close conversation');
  }
};

module.exports = handleCloseConversation;
