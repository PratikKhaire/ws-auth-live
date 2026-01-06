const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Candidate ID is required']
    },
    supervisorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Supervisor ID is required']
    },
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    status: {
      type: String,
      enum: ['open', 'assigned', 'closed'],
      default: 'open'
    },
    closedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Index for efficient querying
conversationSchema.index({ candidateId: 1, status: 1 });
conversationSchema.index({ supervisorId: 1 });
conversationSchema.index({ agentId: 1 });

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;
