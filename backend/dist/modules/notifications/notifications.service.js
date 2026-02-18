import { PrismaClient } from "@prisma/client";
import { getSocketIO } from "../../lib/socket.js";
import logger from "../../utils/logger.js";
const prisma = new PrismaClient();
const derivePriority = (severity) => {
    if (severity === "Critical")
        return "Urgent";
    if (severity === "High")
        return "High";
    return "Normal";
};
// Helper: Map DB Row to Frontend Interface
const mapDbToFrontend = (n) => {
    const status = n.is_read ? "Read" : "Unread";
    const recipients = [];
    if (n.recipient_user_id) {
        recipients.push({
            userId: n.recipient_user_id,
            userName: "User",
        });
    }
    else if (n.recipient_role) {
        recipients.push({
            roleName: n.recipient_role,
        });
    }
    const actions = [];
    if (n.action_url) {
        actions.push({
            id: `action-${n.id}`,
            label: n.action_label || "View Details",
            action: "navigate",
            parameters: { url: n.action_url },
        });
    }
    const sender = n.sender_id
        ? {
            userId: n.sender_id,
            userName: n.users
                ? `${n.users.first_name} ${n.users.last_name}`.trim()
                : "Unknown User",
            system: false,
        }
        : { system: true };
    return {
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        category: n.category,
        severity: n.severity,
        priority: derivePriority(n.severity),
        status: status,
        recipientType: n.recipient_user_id
            ? "User"
            : n.recipient_role
                ? "Role"
                : "Broadcast",
        recipients: recipients,
        sender: sender,
        relatedEntity: n.entity_id
            ? {
                type: n.entity_type,
                id: n.entity_id,
                name: "Entity",
            }
            : undefined,
        actionable: !!n.action_url,
        actions: actions,
        // ✅ FIX: Add safe access to date fields (|| new Date()) to prevent crash on null
        scheduledFor: n.scheduled_for ? n.scheduled_for.toISOString() : undefined,
        expiresAt: n.expires_at ? n.expires_at.toISOString() : undefined,
        // ✅ FIX: Safe access to read_at
        readBy: n.read_at
            ? [{ userId: "Current User", readAt: n.read_at.toISOString() }]
            : [],
        // ✅ FIX: Safe access to timestamps
        createdAt: n.created_at
            ? n.created_at.toISOString()
            : new Date().toISOString(),
        updatedAt: n.updated_at
            ? n.updated_at.toISOString()
            : new Date().toISOString(),
    };
};
export const getNotifications = async (filters) => {
    const { page, limit, status, type, category } = filters;
    const pageInt = parseInt(page, 10) || 1;
    const limitInt = parseInt(limit, 10) || 10;
    const skip = (pageInt - 1) * limitInt;
    const where = {};
    if (status === "unread")
        where.is_read = false;
    if (status === "read")
        where.is_read = true;
    if (type)
        where.type = type;
    if (category)
        where.category = category;
    const [notifications, total] = await Promise.all([
        prisma.notifications.findMany({
            where,
            skip,
            take: limitInt,
            orderBy: { created_at: "desc" },
            include: {
                users: {
                    select: { id: true, first_name: true, last_name: true },
                },
            },
        }),
        prisma.notifications.count({ where }),
    ]);
    return {
        notifications: notifications.map(mapDbToFrontend),
        meta: {
            total,
            page: pageInt,
            limit: limitInt,
            totalPages: Math.ceil(total / limitInt),
        },
    };
};
export const getNotificationById = async (id) => {
    const notification = await prisma.notifications.findUnique({
        where: { id },
        include: {
            users: {
                select: { id: true, first_name: true, last_name: true },
            },
        },
    });
    if (!notification)
        throw new Error("Notification not found");
    return mapDbToFrontend(notification);
};
export const createNotification = async (data) => {
    const { title, message, type, category, severity, recipientType, recipientDetails, scheduledFor, actionable, } = data;
    const payload = {
        title,
        message,
        type,
        category,
        severity,
        is_read: false,
        recipient_user_id: recipientType === "User" ? recipientDetails : null,
        recipient_role: (recipientType === "Role" || recipientType === "Department") ? recipientDetails : null,
        scheduled_for: scheduledFor ? new Date(scheduledFor) : null,
        actionable: actionable || false,
    };
    const newNotification = await prisma.notifications.create({
        data: payload,
        include: {
            users: {
                select: { id: true, first_name: true, last_name: true },
            },
        },
    });
    const frontendNotification = mapDbToFrontend(newNotification);
    const isCritical = frontendNotification.severity === "Critical" ||
        frontendNotification.severity === "High" ||
        frontendNotification.priority === "Urgent" ||
        frontendNotification.priority === "High" ||
        frontendNotification.category === "Emergency" ||
        frontendNotification.category === "System" ||
        frontendNotification.type === "Alert" ||
        frontendNotification.type === "Error";
    if (isCritical) {
        try {
            const io = getSocketIO();
            io.to("superadmins").emit("critical-notification", frontendNotification);
        }
        catch (error) {
            logger.error("Socket emission failed:", error);
        }
    }
    return frontendNotification;
};
export const markAsRead = async (id, userId) => {
    const updated = await prisma.notifications.update({
        where: { id },
        data: {
            is_read: true,
            read_at: new Date(),
        },
        include: {
            users: {
                select: { id: true, first_name: true, last_name: true },
            },
        },
    });
    return mapDbToFrontend(updated);
};
export const updateNotificationDetails = async (id, data) => {
    const { title, message, type, category, severity, priority, actionable } = data;
    const updated = await prisma.notifications.update({
        where: { id },
        data: {
            title,
            message,
            type,
            category,
            severity,
        },
        include: {
            users: {
                select: {
                    id: true,
                    first_name: true,
                    last_name: true,
                },
            },
        },
    });
    return mapDbToFrontend(updated);
};
export const deleteNotification = async (id) => {
    await prisma.notifications.delete({ where: { id } });
    return { success: true };
};
//# sourceMappingURL=notifications.service.js.map