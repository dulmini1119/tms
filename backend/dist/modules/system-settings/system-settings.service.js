import prisma from '../../config/database.js';
import { encryptValue, decryptValue } from '../../utils/encryption.js';
// Helper to parse value from DB (String) to JS Type
const parseValue = (value, type, isEncrypted) => {
    if (value === null)
        return null;
    // Decrypt first if needed
    let rawValue = isEncrypted ? decryptValue(value) : value;
    try {
        switch (type) {
            case 'Boolean':
                return rawValue === 'true';
            case 'Number':
                return Number(rawValue);
            case 'JSON':
                return JSON.parse(rawValue);
            default:
                return rawValue;
        }
    }
    catch (e) {
        return rawValue; // Fallback to string if parsing fails
    }
};
// Helper to convert JS Type to String for DB
const stringifyValue = (value, type) => {
    if (typeof value === 'object')
        return JSON.stringify(value);
    return String(value);
};
export const SystemSettingsService = {
    getAll: async (filters) => {
        const where = {};
        if (filters.category) {
            where.category = filters.category;
        }
        if (filters.search) {
            // Search in key or description
            where.OR = [
                { setting_key: { contains: filters.search, mode: 'insensitive' } },
                { description: { contains: filters.search, mode: 'insensitive' } },
            ];
        }
        const settings = await prisma.system_settings.findMany({
            where,
            orderBy: { category: 'asc' },
        });
        // Map to Frontend Interface
        return settings.map((s) => ({
            id: s.id,
            key: s.setting_key,
            name: s.setting_key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), // Human readable name
            value: parseValue(s.setting_value, s.setting_type, s.is_encrypted || false),
            dataType: s.setting_type || 'String',
            category: s.category || 'General',
            description: s.description,
            encrypted: s.is_encrypted,
            editable: true, // Logic can be added to lock specific keys
            createdAt: s.created_at,
            updatedAt: s.updated_at,
        }));
    },
    getByKey: async (key) => {
        const setting = await prisma.system_settings.findUnique({
            where: { setting_key: key },
        });
        if (!setting)
            return null;
        return {
            id: setting.id,
            key: setting.setting_key,
            value: parseValue(setting.setting_value, setting.setting_type, setting.is_encrypted || false),
            dataType: setting.setting_type,
            encrypted: setting.is_encrypted,
        };
    },
    upsertSetting: async (key, data, userId) => {
        // Check if exists
        const existing = await prisma.system_settings.findUnique({
            where: { setting_key: key },
        });
        let finalValue = data.setting_value;
        let settingType = existing?.setting_type || 'String';
        // Handle encryption
        if (data.is_encrypted === true && !existing?.is_encrypted) {
            // Newly encrypted
            finalValue = encryptValue(stringifyValue(data.setting_value, settingType));
        }
        else if (existing?.is_encrypted) {
            // Re-encrypt updated value
            finalValue = encryptValue(stringifyValue(data.setting_value, settingType));
        }
        else {
            // Normal string storage
            finalValue = stringifyValue(data.setting_value, settingType);
        }
        const result = await prisma.system_settings.upsert({
            where: { setting_key: key },
            update: {
                setting_value: finalValue,
                description: data.description,
                is_encrypted: data.is_encrypted || existing?.is_encrypted,
                updated_at: new Date(),
                updated_by: userId,
            },
            create: {
                setting_key: key,
                setting_value: finalValue,
                setting_type: data.setting_type || 'String',
                category: data.category || 'General',
                description: data.description,
                is_encrypted: data.is_encrypted || false,
                created_by: userId,
                updated_by: userId,
            },
        });
        return result;
    },
    deleteSetting: async (key) => {
        return prisma.system_settings.delete({
            where: { setting_key: key },
        });
    },
};
//# sourceMappingURL=system-settings.service.js.map