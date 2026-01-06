const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { env } = require('./config');
const { authRoutes, conversationRoutes, adminRoutes } = require('./routes');
const errorMiddleware = require('./middleware/error.middleware');

const app = express();

app.use(helmet());

app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/auth', authRoutes);
app.use('/conversations', conversationRoutes);
app.use('/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

app.use(errorMiddleware);

module.exports = app;
