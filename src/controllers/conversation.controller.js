const { Conversation, User, Message } = require('../models');
const { successResponse } = require('../utils/response');
const {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  ConflictError
} = require('../utils/errors');
const { getConversationMessages } = require('../websocket/state');

/**
 * POST /conversations
 * Create a new conversation (Candidate only)
 */
const createConversation = async (req, res, next) => {
  try {
    const { supervisorId } = req.body;
    const candidateId = req.user.userId;

    // Validate supervisorId
    if (!supervisorId) {
      throw new BadRequestError('supervisorId is required');
    }

    // Verify supervisor exists and is a supervisor
    const supervisor = await User.findById(supervisorId);
    if (!supervisor) {
      throw new NotFoundError('Supervisor not found');
    }
    if (supervisor.role !== 'supervisor') {
      throw new BadRequestError('supervisorId must reference a user with supervisor role');
    }

    // Check if candidate already has an active conversation
    const existingConversation = await Conversation.findOne({
      candidateId,
      status: { $in: ['open', 'assigned'] }
    });

    if (existingConversation) {
      throw new ConflictError('You already have an active conversation');
    }

    // Create conversation
    const conversation = await Conversation.create({
      candidateId,
      supervisorId
    });

    return successResponse(res, {
      _id: conversation._id,
      status: conversation.status,
      supervisorId: conversation.supervisorId
    }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /conversations/:id/assign
 * Assign an agent to a conversation (Supervisor only)
 */
const assignAgent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { agentId } = req.body;
    const supervisorId = req.user.userId;

    // Validate agentId
    if (!agentId) {
      throw new BadRequestError('agentId is required');
    }

    // Find conversation
    const conversation = await Conversation.findById(id);
    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    // Verify supervisor owns this conversation
    if (conversation.supervisorId.toString() !== supervisorId) {
      throw new ForbiddenError('cannot assign agent');
    }

    // Verify agent exists and belongs to this supervisor
    const agent = await User.findById(agentId);
    if (!agent) {
      throw new NotFoundError('Agent not found');
    }
    if (agent.role !== 'agent') {
      throw new BadRequestError('agentId must reference a user with agent role');
    }
    if (agent.supervisorId.toString() !== supervisorId) {
      throw new ForbiddenError("Agent doesn't belong to you");
    }

    // Verify conversation is not closed
    if (conversation.status === 'closed') {
      throw new BadRequestError('Cannot assign agent to closed conversation');
    }

    // Assign agent (conversation status remains "open" until agent joins via WebSocket)
    conversation.agentId = agentId;
    await conversation.save();

    return successResponse(res, {
      conversationId: conversation._id,
      agentId: conversation.agentId,
      supervisorId: conversation.supervisorId
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /conversations/:id
 * Get conversation details with messages
 */
const getConversation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Find conversation
    const conversation = await Conversation.findById(id);
    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    // Check access permissions
    if (userRole !== 'admin') {
      const isCandidate = conversation.candidateId.toString() === userId;
      const isSupervisor = conversation.supervisorId.toString() === userId;
      const isAgent = conversation.agentId && conversation.agentId.toString() === userId;

      if (!isCandidate && !isSupervisor && !isAgent) {
        throw new ForbiddenError('Not allowed to access this conversation');
      }
    }

    // Get messages based on conversation status
    let messages = [];

    if (conversation.status === 'assigned') {
      // Get in-memory messages for active conversations
      messages = getConversationMessages(id);
    } else if (conversation.status === 'closed') {
      // Get persisted messages from MongoDB for closed conversations
      const dbMessages = await Message.find({ conversationId: id })
        .sort({ createdAt: 1 });

      messages = dbMessages.map(msg => ({
        senderId: msg.senderId,
        senderRole: msg.senderRole,
        content: msg.content,
        createdAt: msg.createdAt
      }));
    }
    // For 'open' status, return empty messages array

    return successResponse(res, {
      _id: conversation._id,
      status: conversation.status,
      agentId: conversation.agentId,
      supervisorId: conversation.supervisorId,
      candidateId: conversation.candidateId,
      messages
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /conversations/:id/close
 * Close a conversation via HTTP (Admin and Supervisor only)
 * This is for conversations that haven't been assigned yet (status = "open")
 */
const closeConversation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Find conversation
    const conversation = await Conversation.findById(id);
    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    // Admin can close any conversation, supervisor can only close their own
    if (userRole === 'supervisor') {
      if (conversation.supervisorId.toString() !== userId) {
        throw new ForbiddenError('Not allowed to close this conversation');
      }
    }

    // Can only close "open" conversations via HTTP
    // "assigned" conversations must be closed via WebSocket by the agent
    if (conversation.status !== 'open') {
      throw new BadRequestError(`Cannot close conversation with status: ${conversation.status}`);
    }

    // Close conversation
    conversation.status = 'closed';
    conversation.closedAt = new Date();
    await conversation.save();

    return successResponse(res, {
      conversationId: conversation._id,
      status: conversation.status
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createConversation,
  assignAgent,
  getConversation,
  closeConversation
};
