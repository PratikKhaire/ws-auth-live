const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const authMiddleware = require('../middleware/auth.middleware');
const rbacMiddleware = require('../middleware/rbac.middleware');

// All routes require authentication and admin role
router.use(authMiddleware);
router.use(rbacMiddleware(['admin']));

// GET /admin/analytics - Get system analytics
router.get('/analytics', adminController.getAnalytics);

module.exports = router;
