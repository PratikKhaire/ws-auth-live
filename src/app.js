const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { env } = require('./config');
const { authRoutes, conversationRoutes, adminRoutes } = require('./routes');
const errorMiddleware = require('./middleware/error.middleware');

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());

// CORS
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/auth', authRoutes);
app.use('/conversations', conversationRoutes);
app.use('/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Global error handler
app.use(errorMiddleware);

module.exports = app;
