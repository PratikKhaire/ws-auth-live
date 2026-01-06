const { Conversation, User, Message } = require('../models');
const { successResponse } = require('../utils/response');
const {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  ConflictError
} = require('../utils/errors');
const { getConversationMessages } = require('../websocket/state');

const createConversation = async (req, res, next) => {
  try {
    const { supervisorId } = req.body;
    const candidateId = req.user.userId;

    if (!supervisorId) {
      throw new BadRequestError('supervisorId is required');
    }

    const supervisor = await User.findById(supervisorId);
    if (!supervisor) {
      throw new NotFoundError('Supervisor not found');
    }
    if (supervisor.role !== 'supervisor') {
      throw new BadRequestError('supervisorId must reference a user with supervisor role');
    }

    const existingConversation = await Conversation.findOne({
      candidateId,
      status: { $in: ['open', 'assigned'] }
    });

    if (existingConversation) {
      throw new ConflictError('Candidate already has an active conversation');
    }

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

const assignAgent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { agentId } = req.body;
    const supervisorId = req.user.userId;

    if (!agentId) {
      throw new BadRequestError('agentId is required');
    }

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    if (conversation.supervisorId.toString() !== supervisorId) {
      throw new ForbiddenError('cannot assign agent');
    }

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

    if (conversation.status === 'closed') {
      throw new BadRequestError('Cannot assign agent to closed conversation');
    }

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

const getConversation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    if (userRole !== 'admin') {
      const isCandidate = conversation.candidateId.toString() === userId;
      const isSupervisor = conversation.supervisorId.toString() === userId;
      const isAgent = conversation.agentId && conversation.agentId.toString() === userId;

      if (!isCandidate && !isSupervisor && !isAgent) {
        throw new ForbiddenError('Not allowed to access this conversation');
      }
    }

    let messages = [];

    if (conversation.status === 'assigned') {
      messages = getConversationMessages(id);
    } else if (conversation.status === 'closed') {
      const dbMessages = await Message.find({ conversationId: id })
        .sort({ createdAt: 1 });

      messages = dbMessages.map(msg => ({
        senderId: msg.senderId,
        senderRole: msg.senderRole,
        content: msg.content,
        createdAt: msg.createdAt
      }));
    }

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

const closeConversation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    if (userRole === 'supervisor') {
      if (conversation.supervisorId.toString() !== userId) {
        throw new ForbiddenError('Not allowed to close this conversation');
      }
    }

    if (conversation.status !== 'open') {
      throw new BadRequestError(`Cannot close conversation with status: ${conversation.status}`);
    }

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
