import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
// no .ts
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimit.js';
import logger from './utils/logger.js';
import config from './config/environment.js';
// Import routes
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
// Import other module routes here as you create them
const app = express();
// CORS configuration
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || config.cors.allowedOrigins.includes(origin) || config.app.env === 'development') {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    maxAge: 86400, // 24 hours
};
// Middleware
app.use(helmet()); // Security headers
app.use(cors(corsOptions)); // CORS
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies
// Logging
if (config.app.env === 'development') {
    app.use(morgan('dev'));
}
else {
    app.use(morgan('combined', {
        stream: {
            write: (message) => logger.info(message.trim()),
        },
    }));
}
// Rate limiting
app.use(`/api/${config.app.apiVersion}`, apiLimiter);
// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: config.app.env,
        version: config.app.apiVersion,
    });
});
// API Routes
const apiPrefix = `/api/${config.app.apiVersion}`;
app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/users`, usersRoutes);
// Add other module routes here
// app.use(`${apiPrefix}/organizations`, organizationsRoutes);
// app.use(`${apiPrefix}/cab-services`, cabServicesRoutes);
// app.use(`${apiPrefix}/vehicles`, vehiclesRoutes);
// app.use(`${apiPrefix}/trips`, tripsRoutes);
// app.use(`${apiPrefix}/trip-costs`, tripCostsRoutes);
// app.use(`${apiPrefix}/alerts`, alertsRoutes);
// app.use(`${apiPrefix}/notifications`, notificationsRoutes);
// app.use(`${apiPrefix}/settings`, settingsRoutes);
// 404 handler
app.use(notFoundHandler);
// Global error handler (must be last)
app.use(errorHandler);
export default app;
//# sourceMappingURL=app.js.map