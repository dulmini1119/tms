// src/server.ts
import http from 'http';
import app from './app.js'; // your existing Express app
import config from './config/environment.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import logger from './utils/logger.js';
import { Server } from 'socket.io';

// Make io accessible globally or via app
let io: Server | null = null;

const PORT = config.app.port || 3001;

async function startServer() {
  try {
    // Connect to database
    await connectDatabase();

    // Create HTTP server (required for Socket.IO)
    const server = http.createServer(app);

    // Initialize Socket.IO
    io = new Server(server, {
      cors: {
        origin: '*', // ← Change to your frontend domain in production (e.g. http://localhost:3000)
        methods: ['GET', 'POST'],
        credentials: true,
      },
      path: '/socket.io', // default path — matches what we proxy in Next.js
    });

    // Make io available to your routes/services
    app.set('socketio', io);

    // Socket.IO connection handling
    io.on('connection', (socket) => {
      logger.info(`New client connected: ${socket.id}`);

      // Allow clients to join the superadmin room
      socket.on('join-superadmin', () => {
        socket.join('superadmins');
        logger.info(`Client ${socket.id} joined superadmins room`);
      });

      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });
    });

    // Start listening
    server.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      logger.info(`Environment: ${config.app.env}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`API base URL: http://localhost:${PORT}`);
      logger.info(`Socket.IO ready at path /socket.io`);
    });

    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;
    server.requestTimeout = 300000;

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`\n${signal} received. Starting graceful shutdown...`);

      // Close HTTP server
      server.close(async () => {
        logger.info('HTTP server closed');
        // Close Socket.IO connections
        io?.close();
        logger.info('Socket.IO closed');
        await disconnectDatabase();
        logger.info('Database disconnected – graceful shutdown complete');
        process.exit(0);
      });

      // Force exit if it takes too long
      setTimeout(() => {
        logger.error('Could not close connections in time – forcing shutdown');
        process.exit(1);
      }, 10_000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception:', err);
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Promise Rejection:', reason);
      gracefulShutdown('unhandledRejection');
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start everything
startServer();