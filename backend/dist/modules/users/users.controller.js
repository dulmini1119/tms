import { UsersService } from './users.service';
import ApiResponse from '../../utils/response';
export class UsersController {
    constructor() {
        /**
         * Get all users
         */
        this.getUsers = async (req, res, next) => {
            try {
                const filters = req.query;
                const result = await this.usersService.getUsers(filters);
                ApiResponse.success(res, result);
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * Get user by ID
         */
        this.getUserById = async (req, res, next) => {
            try {
                const { userId } = req.params;
                const user = await this.usersService.getUserById(userId);
                ApiResponse.success(res, { user });
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * Create user
         */
        this.createUser = async (req, res, next) => {
            try {
                const user = await this.usersService.createUser(req.body);
                ApiResponse.created(res, { user }, 'User created successfully');
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * Update user
         */
        this.updateUser = async (req, res, next) => {
            try {
                const { userId } = req.params;
                const user = await this.usersService.updateUser(userId, req.body);
                ApiResponse.success(res, { user }, 'User updated successfully');
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * Delete user
         */
        this.deleteUser = async (req, res, next) => {
            try {
                const { userId } = req.params;
                const result = await this.usersService.deleteUser(userId);
                ApiResponse.success(res, result);
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * Get user permissions
         */
        this.getUserPermissions = async (req, res, next) => {
            try {
                const { userId } = req.params;
                const result = await this.usersService.getUserPermissions(userId);
                ApiResponse.success(res, result);
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * Update user permissions
         */
        this.updateUserPermissions = async (req, res, next) => {
            try {
                const { userId } = req.params;
                const { permissions } = req.body;
                const result = await this.usersService.updateUserPermissions(userId, permissions);
                ApiResponse.success(res, result, 'Permissions updated successfully');
            }
            catch (error) {
                next(error);
            }
        };
        this.usersService = new UsersService();
    }
}
//# sourceMappingURL=users.controller.js.map