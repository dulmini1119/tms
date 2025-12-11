// backend/modules/permissions/permission.controllers.ts

import { Request, Response, NextFunction } from 'express';
import { PermissionsService } from './permission.service.js';
import ApiResponse from '../../utils/response.js';

export class PermissionsController {
  private service = new PermissionsService();

  // ← Your existing methods (perfect)
  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getAllWithRoleAssignments();
      ApiResponse.success(res, data);
    } catch (error) {
      next(error);
    }
  };

  save = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { roleId, permissionIds } = req.body;
      await this.service.updateRolePermissions(roleId, permissionIds);
      ApiResponse.success(res, { message: 'Permissions saved' });
    } catch (error) {
      next(error);
    }
  };

  // ADD THIS METHOD — ONLY THIS
  getAllPermissions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const permissions = await this.service.getAllPermissions(); // ← call service
      ApiResponse.success(res, permissions);
    } catch (error) {
      next(error);
    }
  };
}