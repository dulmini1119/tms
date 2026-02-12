import { SystemSettingsService } from './system-settings.service.js';
import ApiResponse from '../../utils/response.js';
import { AppError } from '../../middleware/errorHandler.js';
import { HTTP_STATUS, ERROR_CODES } from '../../utils/constants.js';
export const getSettings = async (req, res, next) => {
    try {
        const filters = {
            category: req.query.category,
            search: req.query.search,
        };
        const settings = await SystemSettingsService.getAll(filters);
        return ApiResponse.success(res, { settings });
    }
    catch (error) {
        next(error);
    }
};
export const getSettingByKey = async (req, res, next) => {
    try {
        const { key } = req.params;
        const setting = await SystemSettingsService.getByKey(key);
        if (!setting) {
            throw new AppError(ERROR_CODES.NOT_FOUND, 'Setting not found', HTTP_STATUS.NOT_FOUND);
        }
        return ApiResponse.success(res, { setting });
    }
    catch (error) {
        next(error);
    }
};
export const updateSetting = async (req, res, next) => {
    try {
        const { key } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            throw new AppError(ERROR_CODES.UNAUTHORIZED, 'Unauthorized', HTTP_STATUS.UNAUTHORIZED);
        }
        const updated = await SystemSettingsService.upsertSetting(key, req.body, userId);
        return ApiResponse.success(res, { setting: updated }, 'Setting updated successfully');
    }
    catch (error) {
        next(error);
    }
};
export const createSetting = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            throw new AppError(ERROR_CODES.UNAUTHORIZED, 'Unauthorized', HTTP_STATUS.UNAUTHORIZED);
        const { setting_key, ...rest } = req.body;
        const existing = await SystemSettingsService.getByKey(setting_key);
        if (existing) {
            throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Setting key already exists', HTTP_STATUS.BAD_REQUEST);
        }
        const newSetting = await SystemSettingsService.upsertSetting(setting_key, { ...rest, setting_key }, userId);
        return ApiResponse.created(res, { setting: newSetting }, 'Setting created');
    }
    catch (error) {
        next(error);
    }
};
export const deleteSetting = async (req, res, next) => {
    try {
        const { key } = req.params;
        await SystemSettingsService.deleteSetting(key);
        return ApiResponse.success(res, null, 'Setting deleted successfully');
    }
    catch (error) {
        next(error);
    }
};
//# sourceMappingURL=system-settings.controller.js.map