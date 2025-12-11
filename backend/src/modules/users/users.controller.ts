import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.js';
import { UsersService } from './users.service.js';
import ApiResponse from '../../utils/response.js';
import { ValidatedRequest } from '../../middleware/validation.js';

export class UsersController {
  private usersService = new UsersService();

getUsers = async (req: ValidatedRequest, res: Response, next: NextFunction) => {
  try {
    const filters: any = { ...req.validatedQuery };

    // THIS IS THE FINAL WINNING VERSION
    if (filters.forDepartmentHead === 'true') {
      // Ignore all other filters — only return real HODs
      filters.position = 'HOD';
      filters.status = 'Active'; // optional: only active HODs
      delete filters.role;
      delete filters.forDepartmentHead;
    }

    const result = await this.usersService.getUsers(filters);
    return ApiResponse.success(res, { 
      users: result.users, 
      pagination: result.pagination 
    });
  } catch (error) { 
    next(error); 
  }
};
  getUserById = async (req: ValidatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.validatedParams?.id || req.params.id;
      const user = await this.usersService.getUserById(id);
      ApiResponse.success(res, { user });
    } catch (error) { next(error); }
  };

  createUser = async (req: ValidatedRequest, res: Response, next: NextFunction) => {
    if (res.headersSent) return;
    try {
      const user = await this.usersService.createUser(req.validatedBody);
      ApiResponse.created(res, { user });
    } catch (error) { next(error); }
  };

  updateUser = async (req: ValidatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.validatedParams?.id || req.params.id;
      const user = await this.usersService.updateUser(id, req.validatedBody);
      ApiResponse.success(res, { user }, 'User updated successfully');
    } catch (error) { next(error); }
  };

  deleteUser = async (req: ValidatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.validatedParams?.id || req.params.id;
      const result = await this.usersService.deleteUser(id);
      ApiResponse.success(res, result);
    } catch (error) { next(error); }
  };
}
