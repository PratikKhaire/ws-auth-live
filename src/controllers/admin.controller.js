const { User, Conversation } = require('../models');
const { successResponse } = require('../utils/response');

/**
 * GET /admin/analytics
 * Get system analytics grouped by supervisor (Admin only)
 */
const getAnalytics = async (req, res, next) => {
  try {
    // Get all supervisors
    const supervisors = await User.find({ role: 'supervisor' });

    // Build analytics for each supervisor
    const analytics = await Promise.all(
      supervisors.map(async (supervisor) => {
        // Count agents under this supervisor
        const agentCount = await User.countDocuments({
          role: 'agent',
          supervisorId: supervisor._id
        });

        // Get all agents under this supervisor
        const agents = await User.find({
          role: 'agent',
          supervisorId: supervisor._id
        }).select('_id');

        const agentIds = agents.map(agent => agent._id);

        // Count closed conversations handled by agents under this supervisor
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
