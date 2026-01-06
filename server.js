const http = require('http');
const app = require('./src/app');
const { connectDB, env } = require('./src/config');
const { initWebSocket } = require('./src/websocket/server');

const server = http.createServer(app);

initWebSocket(server);

const startServer = async () => {
  try {
    await connectDB();

    server.listen(env.PORT, () => {
      console.log(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
      console.log(`REST API: http://localhost:${env.PORT}`);
      console.log(`WebSocket: ws://localhost:${env.PORT}/ws`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  server.close(() => {
    process.exit(1);
  });
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

startServer();
