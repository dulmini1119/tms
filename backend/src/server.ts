// src/server.ts
import app from "./app.js"; // no .js or .ts extension
import config from "./config/environment.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import logger from "./utils/logger.js";

const PORT = config.app.port || 3001;

async function startServer() {
  try {
    // Connect to database
    await connectDatabase();

    // Start the HTTP server
    const server = app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      logger.info(`Environment: ${config.app.env}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);

      // Clean, prefix-free URLs
      logger.info(`API base URL: http://localhost:${PORT}`);

      server.keepAliveTimeout = 65000; // 65 seconds (default is 5s!)
      server.headersTimeout = 66000; // 66 seconds
      server.requestTimeout = 300000;
      // add more as you create them
    });

    // Graceful shutdown handling
    const gracefulShutdown = async (signal: string) => {
      logger.info(`\n${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        logger.info("HTTP server closed");
        await disconnectDatabase();
        logger.info("Database disconnected – graceful shutdown complete");
        process.exit(0);
      });

      // Force exit after 10 seconds if connections don't close
      setTimeout(() => {
        logger.error("Could not close connections in time – forcing shutdown");
        process.exit(1);
      }, 10_000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM")); // Docker/K8s
    process.on("SIGINT", () => gracefulShutdown("SIGINT")); // Ctrl+C

    // Catch unhandled errors (safety net)
    process.on("uncaughtException", (err) => {
      logger.error("Uncaught Exception:", err);
      gracefulShutdown("uncaughtException");
    });

    process.on("unhandledRejection", (reason) => {
      logger.error("Unhandled Promise Rejection:", reason);
      gracefulShutdown("unhandledRejection");
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Start it!
startServer();
