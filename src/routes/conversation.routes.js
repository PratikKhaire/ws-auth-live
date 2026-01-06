const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversation.controller');
const authMiddleware = require('../middleware/auth.middleware');
const rbacMiddleware = require('../middleware/rbac.middleware');

// All routes require authentication
router.use(authMiddleware);

// POST /conversations - Create conversation (Candidate only)
router.post(
  '/',
  rbacMiddleware(['candidate']),
  conversationController.createConversation
);

// POST /conversations/:id/assign - Assign agent (Supervisor only)
router.post(
  '/:id/assign',
  rbacMiddleware(['supervisor']),
  conversationController.assignAgent
);

// GET /conversations/:id - Get conversation (All authenticated users with access)
router.get(
  '/:id',
  conversationController.getConversation
);

// POST /conversations/:id/close - Close conversation via HTTP (Admin/Supervisor only)
router.post(
  '/:id/close',
  rbacMiddleware(['admin', 'supervisor']),
  conversationController.closeConversation
);

module.exports = router;
