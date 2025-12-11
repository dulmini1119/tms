import { Request, Response, NextFunction } from 'express';
import { RolesService } from './roles.service.js';
import ApiResponse from '../../utils/response.js';
import { CreateRoleDto, UpdateRoleDto } from './roles.validation.js';

export class RolesController {
  private service = new RolesService();

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const roles = await this.service.getAll();
      ApiResponse.success(res, roles);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const role = await this.service.getById(req.params.id);
      ApiResponse.success(res, role);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request<{}, {}, CreateRoleDto>, res: Response, next: NextFunction) => {
    try {
      const role = await this.service.create(req.body);
      ApiResponse.success(res, role, 'Role created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request<{ id: string }, {}, UpdateRoleDto>, res: Response, next: NextFunction) => {
    try {
      const role = await this.service.update(req.params.id, req.body);
      ApiResponse.success(res, role, 'Role updated successfully');
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.delete(req.params.id);
      ApiResponse.success(res, null, 'Role deleted successfully');
    } catch (error) {
      next(error);
    }
  };
}