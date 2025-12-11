import { AuthService } from './auth.service';
import ApiResponse from '../../utils/response';
export class AuthController {
    constructor() {
        /**
         * Login
         */
        this.login = async (req, res, next) => {
            try {
                const { email, password } = req.body;
                const result = await this.authService.login(email, password);
                ApiResponse.success(res, result, 'Login successful');
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * Register
         */
        this.register = async (req, res, next) => {
            try {
                const user = await this.authService.register(req.body);
                ApiResponse.created(res, { user }, 'User registered successfully');
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * Refresh Token
         */
        this.refreshToken = async (req, res, next) => {
            try {
                const { refreshToken } = req.body;
                const result = await this.authService.refreshToken(refreshToken);
                ApiResponse.success(res, result, 'Token refreshed successfully');
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * Logout
         */
        this.logout = async (req, res, next) => {
            try {
                const { refreshToken } = req.body;
                await this.authService.logout(refreshToken);
                ApiResponse.success(res, null, 'Logout successful');
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * Change Password
         */
        this.changePassword = async (req, res, next) => {
            try {
                const { currentPassword, newPassword } = req.body;
                if (!req.user)
                    throw new Error('User not authenticated');
                const result = await this.authService.changePassword(req.user.id, currentPassword, newPassword);
                ApiResponse.success(res, result, 'Password changed successfully');
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * Get Current User
         */
        this.getCurrentUser = async (req, res, next) => {
            try {
                if (!req.user)
                    throw new Error('User not authenticated');
                const user = await this.authService.getCurrentUser(req.user.id);
                ApiResponse.success(res, { user }, 'Current user fetched successfully');
            }
            catch (error) {
                next(error);
            }
        };
        this.authService = new AuthService();
    }
}
//# sourceMappingURL=auth.controllers.js.map