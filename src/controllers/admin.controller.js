const { User, Conversation } = require('../models');
const { successResponse } = require('../utils/response');

const getAnalytics = async (req, res, next) => {
  try {
    const supervisors = await User.find({ role: 'supervisor' });

    const analytics = await Promise.all(
      supervisors.map(async (supervisor) => {
        const agentCount = await User.countDocuments({
          role: 'agent',
          supervisorId: supervisor._id
        });

        const agents = await User.find({
          role: 'agent',
          supervisorId: supervisor._id
        }).select('_id');

        const agentIds = agents.map(agent => agent._id);

        const conversationsHandled = await Conversation.countDocuments({
          agentId: { $in: agentIds },
          status: 'closed'
        });

        return {
          supervisorId: supervisor._id,
          supervisorName: supervisor.name,
          agents: agentCount,
          conversationsHandled
        };
      })
    );

    return successResponse(res, analytics);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAnalytics
};
