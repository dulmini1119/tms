import { RolesService } from './roles.service.js';
import ApiResponse from '../../utils/response.js';
export class RolesController {
    service = new RolesService();
    getAll = async (req, res, next) => {
        try {
            const roles = await this.service.getAll();
            ApiResponse.success(res, roles);
        }
        catch (error) {
            next(error);
        }
    };
    getById = async (req, res, next) => {
        try {
            const role = await this.service.getById(req.params.id);
            ApiResponse.success(res, role);
        }
        catch (error) {
            next(error);
        }
    };
    create = async (req, res, next) => {
        try {
            const role = await this.service.create(req.body);
            ApiResponse.success(res, role, 'Role created successfully', 201);
        }
        catch (error) {
            next(error);
        }
    };
    update = async (req, res, next) => {
        try {
            const role = await this.service.update(req.params.id, req.body);
            ApiResponse.success(res, role, 'Role updated successfully');
        }
        catch (error) {
            next(error);
        }
    };
    delete = async (req, res, next) => {
        try {
            await this.service.delete(req.params.id);
            ApiResponse.success(res, null, 'Role deleted successfully');
        }
        catch (error) {
            next(error);
        }
    };
}
//# sourceMappingURL=roles.controllers.js.map