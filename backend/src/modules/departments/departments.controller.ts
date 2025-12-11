// backend/src/modules/departments/departments.controllers.ts

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.js'; // Import the new type
import { departmentService } from './departments.services.js';
import ApiResponse from '../../utils/response.js';

// Define DTOs for type safety (similar to roles.validation.ts)
interface CreateDepartmentDto {
  name: string;
  code?: string;
  description?: string | null;
  type?: string | null;
  status?: string;
  business_unit_id?: string | null;
  head_id?: string | null;
  budget_allocated?: number | null;
  budget_currency?: string | null;
  fiscal_year?: string | null;
}

interface UpdateDepartmentDto {
  name?: string;
  code?: string;
  description?: string | null;
  type?: string | null;
  status?: string;
  business_unit_id?: string | null;
  head_id?: string | null;
  budget_allocated?: number | null;
  budget_utilized?: number | null;
  budget_currency?: string | null;
  fiscal_year?: string | null;
}

export class DepartmentController {
  private service = departmentService;

  /**
   * GET /departments
   * Retrieves a paginated list of all departments with optional filtering.
   */
  getAll = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.getAll(req.query);
      ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /departments/:id
   * Retrieves a single department by its ID.
   */
  getById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const department = await this.service.getById(id);
      ApiResponse.success(res, department);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /departments/potential-heads
   * Retrieves a list of users who can be assigned as department heads (HODs or Managers).
   */
  getPotentialHeads = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // We can set a high default limit for dropdowns
      const limit = Number(req.query.limit) || 50;
      const page = Number(req.query.page) || 1;
      const result = await this.service.getPotentialHeads(page, limit);
      ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /departments
   * Creates a new department.
   */
  create = async (req: AuthRequest<{}, {}, CreateDepartmentDto>, res: Response, next: NextFunction) => {
    try {
      // We can be sure req.user exists because of the auth middleware
      const userId = req.user!.id; 
      const department = await this.service.create(req.body, userId);
      ApiResponse.success(res, department, 'Department created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /departments/:id
   * Updates an existing department.
   */
  update = async (req: AuthRequest<{ id: string }, {}, UpdateDepartmentDto>, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const department = await this.service.update(id, req.body, userId);
      ApiResponse.success(res, department, 'Department updated successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /departments/:id
   * Soft-deletes a department.
   */
  delete = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.service.delete(id);
      ApiResponse.success(res, null, 'Department deleted successfully');
    } catch (error) {
      next(error);
    }
  };
}

export const departmentController = new DepartmentController();