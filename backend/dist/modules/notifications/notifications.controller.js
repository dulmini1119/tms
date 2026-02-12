import * as notificationService from "./notifications.service.js";
import { createNotificationSchema, } from "./notifications.validation.js";
import ApiResponse from "../../utils/response.js";
// Helper for validation
const validateRequest = (schema, data) => {
    const { error, value } = schema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
    });
    if (error) {
        const errors = error.details.map((detail) => detail.message);
        return { isValid: false, errors };
    }
    return { isValid: true, value };
};
export const getNotifications = async (req, res, next) => {
    try {
        const { page, limit, status, type, category } = req.query;
        const result = await notificationService.getNotifications({
            page,
            limit,
            status,
            type,
            category,
        });
        return ApiResponse.success(res, result);
    }
    catch (error) {
        console.error("Controller Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};
export const getNotificationById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await notificationService.getNotificationById(id);
        return ApiResponse.success(res, { notification: result });
    }
    catch (error) {
        console.error("Controller Error:", error);
        return res.status(404).json({ error: "Notification not found" });
    }
};
export const createNotification = async (req, res, next) => {
    try {
        const validation = validateRequest(createNotificationSchema, req.body);
        if (!validation.isValid)
            return res.status(400).json({ errors: validation.errors });
        const newNotification = await notificationService.createNotification(validation.value);
        return ApiResponse.success(res, { notification: newNotification }, "Notification sent successfully", 201);
    }
    catch (error) {
        console.error("Controller Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};
export const updateNotification = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { is_read, title, message, type, category, severity, priority, actionable, } = req.body;
        let result;
        if (is_read !== undefined) {
            result = await notificationService.markAsRead(id, req.user.id);
        }
        else if (title || message || type || category) {
            result = await notificationService.updateNotificationDetails(id, req.body);
        }
        else {
            return res.status(400).json({ error: "No valid fields to update" });
        }
        return ApiResponse.success(res, { notification: result });
    }
    catch (error) {
        console.error("Controller Error: ", error);
        return res.status(500).json({ error: "Failed to update notification" });
    }
};
export const deleteNotification = async (req, res, next) => {
    try {
        const { id } = req.params;
        await notificationService.deleteNotification(id);
        return ApiResponse.success(res, { message: "Notification deleted" });
    }
    catch (error) {
        console.error("Controller Error:", error);
        return res.status(404).json({ error: "Notification not found" });
    }
};
//# sourceMappingURL=notifications.controller.js.map