import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.js';
import { businessUnitService } from './business-units.service.js';
import ApiResponse from '../../utils/response.js';
import { CreateBusinessUnitDto, UpdateBusinessUnitDto } from './business-units.validation.js';

export class BusinessUnitController {
  private service = businessUnitService;

  getAll = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.getAll(req.query);
      if (!result) {
      return ApiResponse.success(res, { businessUnits: [], total: 0, page: 1, limit: 10, totalPages: 0 });
    }
      ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const bu = await this.service.getById(id);
      ApiResponse.success(res, bu);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: AuthRequest<{}, {}, CreateBusinessUnitDto>, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const bu = await this.service.create(req.body, userId);
      ApiResponse.success(res, bu, 'Business Unit created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthRequest<{ id: string }, {}, UpdateBusinessUnitDto>, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const bu = await this.service.update(id, req.body, userId);
      ApiResponse.success(res, bu, 'Business Unit updated successfully');
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.service.delete(id);
      ApiResponse.success(res, null, 'Business Unit deleted successfully');
    } catch (error) {
      next(error);
    }
  };
}

export const businessUnitController = new BusinessUnitController();
