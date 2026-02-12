// backend/modules/permissions/permission.controllers.ts
import { PermissionsService } from './permission.service.js';
import ApiResponse from '../../utils/response.js';
export class PermissionsController {
    service = new PermissionsService();
    // ← Your existing methods (perfect)
    getAll = async (req, res, next) => {
        try {
            const data = await this.service.getAllWithRoleAssignments();
            ApiResponse.success(res, data);
        }
        catch (error) {
            next(error);
        }
    };
    save = async (req, res, next) => {
        try {
            const { roleId, permissionIds } = req.body;
            await this.service.updateRolePermissions(roleId, permissionIds);
            ApiResponse.success(res, { message: 'Permissions saved' });
        }
        catch (error) {
            next(error);
        }
    };
    // ADD THIS METHOD — ONLY THIS
    getAllPermissions = async (req, res, next) => {
        try {
            const permissions = await this.service.getAllPermissions(); // ← call service
            ApiResponse.success(res, permissions);
        }
        catch (error) {
            next(error);
        }
    };
}
//# sourceMappingURL=permission.controllers.js.map