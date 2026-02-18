import { UsersService } from './users.service.js';
import ApiResponse from '../../utils/response.js';
export class UsersController {
    usersService = new UsersService();
    getUsers = async (req, res, next) => {
        try {
            const filters = { ...req.validatedQuery };
            const forDepartmentHead = filters.forDepartmentHead === true || filters.forDepartmentHead === 'true';
            if (forDepartmentHead) {
                // Return users who are department heads by either role mapping or position.
                filters.forDepartmentHead = true;
                filters.status = 'Active';
            }
            const result = await this.usersService.getUsers(filters);
            return ApiResponse.success(res, {
                users: result.users,
                pagination: result.pagination,
            });
        }
        catch (error) {
            next(error);
        }
    };
    getUserById = async (req, res, next) => {
        try {
            const id = req.validatedParams?.id || req.params.id;
            const user = await this.usersService.getUserById(id);
            ApiResponse.success(res, { user });
        }
        catch (error) {
            next(error);
        }
    };
    createUser = async (req, res, next) => {
        if (res.headersSent)
            return;
        try {
            const user = await this.usersService.createUser(req.validatedBody);
            ApiResponse.created(res, { user });
        }
        catch (error) {
            next(error);
        }
    };
    updateUser = async (req, res, next) => {
        try {
            const id = req.validatedParams?.id || req.params.id;
            const user = await this.usersService.updateUser(id, req.validatedBody);
            ApiResponse.success(res, { user }, 'User updated successfully');
        }
        catch (error) {
            next(error);
        }
    };
    deleteUser = async (req, res, next) => {
        try {
            const id = req.validatedParams?.id || req.params.id;
            const result = await this.usersService.deleteUser(id);
            ApiResponse.success(res, result);
        }
        catch (error) {
            next(error);
        }
    };
}
//# sourceMappingURL=users.controller.js.map