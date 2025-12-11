import app from './app'; // no .js
import config from './config/environment';
import { connectDatabase, disconnectDatabase } from './config/database';
import logger from './utils/logger';
const PORT = config.app.port;
async function startServer() {
    try {
        // Connect to database
        await connectDatabase();
        // Start server
        const server = app.listen(PORT, () => {
            logger.info(`🚀 Server is running on port ${PORT}`);
            logger.info(`📝 Environment: ${config.app.env}`);
            logger.info(`🔗 API: http://localhost:${PORT}/api/${config.app.apiVersion}`);
        });
        // Graceful shutdown
        const gracefulShutdown = async (signal) => {
            logger.info(`\n${signal} received. Starting graceful shutdown...`);
            server.close(async () => {
                logger.info('HTTP server closed');
                // Disconnect from database
                await disconnectDatabase();
                logger.info('Graceful shutdown complete');
                process.exit(0);
            });
            // Force shutdown after 10 seconds
            setTimeout(() => {
                logger.error('Forced shutdown after timeout');
                process.exit(1);
            }, 10000);
        };
        // Handle shutdown signals
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        // Handle uncaught errors
        process.on('uncaughtException', (error) => {
            logger.error('Uncaught Exception:', error);
            gracefulShutdown('uncaughtException');
        });
        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
            gracefulShutdown('unhandledRejection');
        });
    }
    catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}
// Start the server
startServer();
//# sourceMappingURL=server.js.map