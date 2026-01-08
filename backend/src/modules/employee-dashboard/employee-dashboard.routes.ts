import { Router } from 'express';
import { getEmployeeDashboard } from './employee-dashboard.controller.js';

const router = Router();

router.get('/', getEmployeeDashboard); // GET /employee/dashboard

export default router;
