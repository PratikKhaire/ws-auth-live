const { Conversation, Message } = require('../../models');
const {
  getRoomName,
  getRoomSockets,
  getConversationMessages,
  clearConversationMessages,
  deleteRoom
} = require('../state');
const { sendToSocket, sendError, broadcastToRoom } = require('../utils');

/**
 * Handle CLOSE_CONVERSATION event
 * Allowed roles: Agent only
 */
const handleCloseConversation = async (ws, data) => {
  try {
    const { conversationId } = data;
    const { userId, role } = ws.user;

    // Validate conversationId
    if (!conversationId) {
      return sendError(ws, 'conversationId is required');
    }

    // Only agents can close via WebSocket
    if (role !== 'agent') {
      return sendError(ws, 'Forbidden for this role');
    }

    // Find conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return sendError(ws, 'Conversation not found');
    }

    // Verify agent is assigned to this conversation
    if (!conversation.agentId || conversation.agentId.toString() !== userId) {
      return sendError(ws, 'not allowed');
    }

    // Check conversation status
    if (conversation.status === 'open') {
      return sendError(ws, 'Conversation not yet assigned');
    }
    if (conversation.status === 'closed') {
      return sendError(ws, 'Conversation already closed');
    }

    const roomName = getRoomName(conversationId);

    // Get in-memory messages
    const messages = getConversationMessages(conversationId);

    // Save messages to MongoDB (bulk insert)
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

    // Update conversation status to "closed"
    conversation.status = 'closed';
    conversation.closedAt = new Date();
    await conversation.save();

    // Broadcast closure to all sockets in room (excluding sender)
    const roomSockets = getRoomSockets(roomName);
    broadcastToRoom(roomSockets, 'CONVERSATION_CLOSED', {
      conversationId
    }, ws);

    // Send confirmation to sender
    sendToSocket(ws, 'CONVERSATION_CLOSED', {
      conversationId
    });

    // Remove all sockets from room and delete room
    deleteRoom(roomName);

    // Clear in-memory messages
    clearConversationMessages(conversationId);

  } catch (error) {
    console.error('Error in CLOSE_CONVERSATION:', error);
    sendError(ws, 'Failed to close conversation');
  }
};

module.exports = handleCloseConversation;
