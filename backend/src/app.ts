import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { auditLog } from './middleware/auditLog.js';
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
import tripRequestRoutes from './modules/trip-request/trip-request.routes.js';
import tripApprovalRoutes from './modules/trip-approvals/trip-approvals.routes.js';
import tripAssignmentRoutes from './modules/trip-assignments/trip-assignments.routes.js';
import employeeDashboardRoutes from './modules/employee-dashboard/employee-dashboard.routes.js';
import tripLogRoutes  from './modules/trip-logs/trip-logs.routes.js';
import tripCostRoutes  from './modules/trip-costs/trip-costs.routes.js';
import invoiceRoutes from './modules/invoice/invoice.routes.js';
import gpsLogsRoutes from './modules/gpslogs/gpslogs.routes.js';
import expiryAlertRoutes from './modules/expiry-alerts/expiry-alerts.routes.js';
import notificationsRoutes from './modules/notifications/notifications.routes.js';
import auditLogsRoutes from './modules/audit-logs/audit-logs.routes.js'

import { authenticate } from './middleware/auth.js';

const app: Application = express();

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
app.use(cookieParser());          
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
app.use(auditLog());


app.use('/auth', authRoutes);                                   
app.use('/users', authenticate, usersRoutes);                    
app.use('/roles', authenticate, rolesRoutes);                    
app.use('/permissions', authenticate, permissionRoutes); 
app.use('/departments', authenticate, departmentRoutes);  
app.use('/business-units',authenticate,businessUnitsRoute)
app.use('/cab-services', authenticate, cabServiceRoutes); 
app.use('/cab-agreements', authenticate, cabAgreementsRoutes); 
app.use('/vehicles', authenticate,vehicleRoutes)
app.use('/vehicle-documents', authenticate,vehicledocumentsRoutes);
app.use('/trip-requests', authenticate, tripRequestRoutes);
app.use('/trip-approvals', authenticate, tripApprovalRoutes)
app.use('/trip-assignments', authenticate, tripAssignmentRoutes)
app.use('/employee/dashboard', authenticate, employeeDashboardRoutes);
app.use('/trip-logs', authenticate,  tripLogRoutes); 
app.use('/trip-costs', authenticate,  tripCostRoutes); 
app.use('/invoices', authenticate, invoiceRoutes); 
app.use('/gps-logs', authenticate, gpsLogsRoutes)
app.use('/expiry-alerts', authenticate, expiryAlertRoutes);
app.use('/notifications', authenticate, notificationsRoutes); 
app.use('/audit-logs', authenticate, auditLogsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
