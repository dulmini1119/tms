import { randomUUID } from "node:crypto";
import prisma from "../../config/database.js";
export const createExpiryAlert = async (data) => {
    const expiryDate = new Date(data.expiry_date);
    const days_to_expiry = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return prisma.expiry_alerts.create({
        data: {
            ...data,
            days_to_expiry,
            status: "Active",
            reminders_sent: 0,
            renewal_process_started: false,
        },
    });
};
export const getExpiryAlerts = async () => {
    return prisma.expiry_alerts.findMany({
        orderBy: {
            expiry_date: "asc",
        },
        include: {
            documents: {
                select: {
                    file_name: true,
                    file_path: true,
                },
            },
            users_expiry_alerts_assigned_toTousers: {
                select: {
                    id: true,
                    first_name: true,
                    last_name: true,
                    email: true,
                },
            },
        },
    });
};
export const updateExpiryAlert = async (id, data) => {
    const safeData = { ...data };
    if (safeData.expiry_date && typeof safeData.expiry_date === "string") {
        safeData.expiry_date = new Date(safeData.expiry_date);
    }
    if (safeData.last_reminder_date &&
        typeof safeData.last_reminder_date === "string") {
        safeData.last_reminder_date = new Date(safeData.last_reminder_date);
    }
    if (safeData.resolved_at && typeof safeData.resolved_at === "string") {
        safeData.resolved_at = new Date(safeData.resolved_at);
    }
    if (safeData.assigned_to) {
        safeData.users_expiry_alerts_assigned_toTousers = {
            connect: { id: safeData.assigned_to },
        };
        delete safeData.assigned_to;
    }
    if (safeData.resolved_by) {
        safeData.users_expiry_alerts_resolved_byTousers = {
            connect: { id: safeData.resolved_by },
        };
        delete safeData.resolved_by;
    }
    if (safeData.renewal_process_started === true) {
        safeData.renewal_process_started = true;
        safeData.status = "Under_Process";
    }
    if (safeData.status === "Renewed") {
        safeData.resolved_at = safeData.resolved_at || new Date();
    }
    delete safeData.updated_at;
    return prisma.expiry_alerts.update({
        where: { id },
        data: safeData,
    });
};
export const syncExpiryAlerts = async () => {
    console.log("🚀 Starting Multi-Source Expiry Alert Sync...");
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + 30);
    const now = new Date();
    let createdCount = 0;
    // --- SOURCE 1: DRIVERS ---
    // (Existing logic was fine, just fixing variable scoping)
    const expiringDrivers = await prisma.drivers.findMany({
        where: {
            license_expiry_date: { lte: thresholdDate, not: null },
        },
        include: {
            users_drivers_user_idTousers: {
                select: { first_name: true, last_name: true, email: true },
            },
        },
    });
    for (const driver of expiringDrivers) {
        const existing = await prisma.expiry_alerts.findFirst({
            where: { entity_type: "Driver", entity_id: driver.id },
        });
        if (existing)
            continue;
        const daysToExpiry = Math.ceil((new Date(driver.license_expiry_date).getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24));
        // ✅ Use user relation for name
        const driverName = driver.users_drivers_user_idTousers
            ? `${driver.users_drivers_user_idTousers.first_name} ${driver.users_drivers_user_idTousers.last_name}`
            : "Unknown Driver";
        await prisma.expiry_alerts.create({
            data: {
                alert_type: "Driver_License",
                entity_type: "Driver",
                entity_id: driver.id,
                entity_name: driverName, // Shows "John Doe" instead of UUID
                document_name: "Driving License",
                document_number: driver.license_number,
                issue_date: driver.license_issue_date,
                expiry_date: driver.license_expiry_date,
                days_to_expiry: daysToExpiry,
                priority: daysToExpiry < 0 ? "Critical" : "High",
                status: daysToExpiry < 0 ? "Expired" : "Expiring_Soon",
            },
        });
        createdCount++;
    }
    // --- SOURCE 2: CAB AGREEMENTS ---
    const expiringAgreements = await prisma.cab_agreements.findMany({
        where: { end_date: { lte: thresholdDate } },
        include: { cab_services: true },
    });
    for (const agreement of expiringAgreements) {
        const existing = await prisma.expiry_alerts.findFirst({
            where: { entity_type: "Cab_Agreement", entity_id: agreement.id },
        });
        if (existing)
            continue;
        const daysToExpiry = Math.ceil((new Date(agreement.end_date).getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24));
        const entityName = agreement.title || agreement.cab_services?.name || "Unknown Service";
        await prisma.expiry_alerts.create({
            data: {
                alert_type: "Cab_Agreement",
                entity_type: "Cab_Agreement",
                entity_id: agreement.id,
                entity_name: entityName, // Shows "City Cab Agreement" instead of UUID
                document_name: "Cab Service Agreement",
                document_number: agreement.agreement_number,
                issue_date: agreement.start_date,
                expiry_date: agreement.end_date,
                days_to_expiry: daysToExpiry,
                priority: daysToExpiry < 0 ? "Critical" : "Medium",
                status: daysToExpiry < 0 ? "Expired" : "Expiring_Soon",
            },
        });
        createdCount++;
    }
    // --- SOURCE 3: INSURANCE ---
    const expiringPolicies = await prisma.insurance_policies.findMany({
        where: { expiry_date: { lte: thresholdDate } },
        include: { vehicles: true }, // We include relation here
    });
    for (const policy of expiringPolicies) {
        const existing = await prisma.expiry_alerts.findFirst({
            where: { entity_type: "Vehicle", entity_id: policy.vehicle_id },
        });
        if (existing)
            continue;
        const daysToExpiry = Math.ceil((new Date(policy.expiry_date).getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24));
        // ✅ Use vehicle relation for name
        const entityName = policy.vehicles?.registration_number || "Unknown Vehicle";
        await prisma.expiry_alerts.create({
            data: {
                alert_type: "Vehicle_Insurance",
                entity_type: "Vehicle",
                entity_id: policy.vehicle_id,
                entity_name: entityName, // Shows "KA-01-1234" instead of UUID
                document_name: "Insurance Policy",
                document_number: policy.policy_number,
                issue_date: policy.start_date,
                expiry_date: policy.expiry_date,
                days_to_expiry: daysToExpiry,
                priority: daysToExpiry < 0 ? "Critical" : "High",
                status: daysToExpiry < 0 ? "Expired" : "Expiring_Soon",
                document_id: policy.document_id,
            },
        });
        createdCount++;
    }
    // --- SOURCE 4: DOCUMENTS (The Fix for your issue) ---
    const expiringDocuments = await prisma.documents.findMany({
        where: {
            expiry_date: {
                lte: thresholdDate,
                not: null,
            },
        },
    });
    for (const doc of expiringDocuments) {
        const safeEntityId = doc.id || randomUUID();
        const existing = await prisma.expiry_alerts.findFirst({
            where: { entity_type: "Document", entity_id: safeEntityId },
        });
        if (existing)
            continue;
        if (!doc.expiry_date)
            continue;
        const daysToExpiry = Math.ceil((new Date(doc.expiry_date).getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24));
        let entityName = safeEntityId; // Default to UUID
        let documentNumber = doc.document_number;
        console.log(`[Document Alert] Processing Document ID: ${doc.id} | Type: "${doc.document_type}" | EntityType: ${doc.entity_type}| EntityID: "${doc.entity_id}"`);
        // ✅ FIX: LOOKUP REAL NAME
        // Since 'documents' table doesn't link to vehicles/drivers,
        // we must fetch them manually if we want real names.
        if (doc.entity_type === "VEHICLE" && doc.entity_id) {
            const vehicle = await prisma.vehicles.findUnique({
                where: { id: doc.entity_id },
                select: { registration_number: true },
            });
            if (vehicle) {
                entityName = `${vehicle.registration_number}`; // Use Plate Number
            }
            else {
                console.warn(`⚠️  Document ID ${doc.id} references VEHICLE with ID ${doc.entity_id}, but no such vehicle found.`);
            }
        }
        if (doc.entity_type === "Driver" && doc.entity_id) {
            const driver = await prisma.drivers.findUnique({
                where: { id: doc.entity_id },
                select: { license_number: true },
            });
            if (driver) {
                entityName = `${driver.license_number}`; // Use License No
            }
        }
        await prisma.expiry_alerts.create({
            data: {
                alert_type: "Document_Expiry",
                entity_type: "Document", // or "Vehicle" / "Driver" based on doc
                entity_id: safeEntityId,
                entity_name: entityName, // ✅ NOW USES REG NUMBER OR LICENSE NO
                document_name: doc.document_type, // e.g., "Fitness_Certificate"
                document_number: documentNumber,
                issue_date: doc.issue_date,
                expiry_date: doc.expiry_date,
                days_to_expiry: daysToExpiry,
                priority: daysToExpiry < 0 ? "Critical" : "High",
                status: daysToExpiry < 0 ? "Expired" : "Expiring_Soon",
                notes: "Auto-generated from system scan",
            },
        });
        createdCount++;
    }
    console.log(`✅ Sync Complete. Created ${createdCount} alerts.`);
    return createdCount;
};
//# sourceMappingURL=expiry-alerts.service.js.map