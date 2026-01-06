const { Conversation } = require('../../models');
const { joinRoom, getRoomName, initConversationMessages } = require('../state');
const { sendToSocket, sendError } = require('../utils');

/**
 * Handle JOIN_CONVERSATION event
 * Allowed roles: Candidate, Agent
 */
const handleJoinConversation = async (ws, data) => {
  try {
    const { conversationId } = data;
    const { userId, role } = ws.user;

    // Validate conversationId
    if (!conversationId) {
      return sendError(ws, 'conversationId is required');
    }

    // Find conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return sendError(ws, 'Conversation not found');
    }

    // Check if conversation is closed
    if (conversation.status === 'closed') {
      return sendError(ws, 'Conversation already closed');
    }

    const roomName = getRoomName(conversationId);

    // Handle based on role
    if (role === 'candidate') {
      // Verify candidate owns the conversation
      if (conversation.candidateId.toString() !== userId) {
        return sendError(ws, 'not allowed');
      }

      // Create room if not exists and add socket
      joinRoom(roomName, ws);

      // Initialize in-memory messages
      initConversationMessages(conversationId);

      // Send success response
      sendToSocket(ws, 'JOINED_CONVERSATION', {
        conversationId,
        status: conversation.status
      });

    } else if (role === 'agent') {
      // Verify agent is assigned to this conversation
      if (!conversation.agentId || conversation.agentId.toString() !== userId) {
        return sendError(ws, 'not allowed');
      }

      // Update conversation status to "assigned"
      if (conversation.status === 'open') {
        conversation.status = 'assigned';
        await conversation.save();
      }

      // Create room if not exists and add socket
      joinRoom(roomName, ws);

      // Initialize in-memory messages
      initConversationMessages(conversationId);

      // Send success response
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
