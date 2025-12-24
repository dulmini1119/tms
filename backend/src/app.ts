import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimit.js';
import logger from './utils/logger.js';
import config from './config/environment.js';

// Import routes
import authRoutes from './modules/auth/auth.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import permissionRoutes from './modules/permissions/permission.routes.js';
import rolesRoutes from './modules/roles/roles.routes.js';
import departmentRoutes from './modules/departments/departments.routes.js';
import businessUnitsRoute from './modules/business-units/business-units.routes.js';
import cabServiceRoutes from './modules/cab-service/cab-service.routes.js';
import cabAgreementsRoutes from './modules/cab-agreements/cab-agreements.routes.js';
import vehicleRoutes from './modules/vehicles/vehicles.routes.js';
import vehicledocumentsRoutes from './modules/vehicle-documents/vehicle-documents.routes.js';
// ADD THIS LINE — CRITICAL!
import { authenticate } from './middleware/auth.js';

const app: Application = express();

// CORS
const corsOptions = {
  origin: (origin: string | undefined, callback: Function) => {
    if (!origin || config.cors.allowedOrigins.includes(origin) || config.app.env === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  maxAge: 86400,
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(cookieParser());           // ← correct
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (config.app.env === 'development') {
  app.use(morgan('dev') as express.RequestHandler);
} else {
  app.use(morgan('combined', {
    stream: { write: (message: string) => logger.info(message.trim()) },
  }) as express.RequestHandler);
}

app.use(apiLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ROUTES
app.use('/auth', authRoutes);                                    // PUBLIC
app.use('/users', authenticate, usersRoutes);                    // PROTECTED
app.use('/roles', authenticate, rolesRoutes);                    // PROTECTED
app.use('/permissions', authenticate, permissionRoutes); 
app.use('/departments', authenticate, departmentRoutes);  
app.use('/business-units',authenticate,businessUnitsRoute)
app.use('/cab-services', cabServiceRoutes); // PROTECTED
app.use('/cab-agreements', authenticate, cabAgreementsRoutes); 
app.use('/vehicles', authenticate,vehicleRoutes)
app.use('/vehicle-documents', authenticate,vehicledocumentsRoutes); // PROTECTED

// 404 & Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;