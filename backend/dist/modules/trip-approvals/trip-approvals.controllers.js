import * as tripApprovalService from "./trip-approvals.service.js";
import { approveActionSchema } from "./trip-approvals.validation.js";
// Helper for validation
const validateRequest = (schema, data) => {
    const { error, value } = schema.validate(data, { abortEarly: false, stripUnknown: true });
    if (error) {
        const errors = error.details.map((detail) => detail.message);
        return { isValid: false, errors };
    }
    return { isValid: true, value };
};
// GET all trip approvals (Aggregated view)
export const getAllTripApprovals = async (req, res) => {
    try {
        const { search = "", status = "all", page = "1", pageSize = "10" } = req.query;
        const filters = {
            searchTerm: search,
            status: status,
            page: parseInt(page),
            pageSize: parseInt(pageSize)
        };
        const result = await tripApprovalService.getAllTripApprovals(filters);
        res.json(result);
    }
    catch (error) {
        console.error("Controller Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
// GET trip approval details by ID (For History/View Dialogs)
export const getApprovalById = async (req, res) => {
    try {
        const { id } = req.params;
        // Note: ID here refers to the Trip Request ID, as approvals are nested
        const result = await tripApprovalService.getApprovalDetails(id);
        res.json(result);
    }
    catch (error) {
        console.error("Controller Error:", error);
        if (error.message === "Approval not found")
            return res.status(404).json({ error: error.message });
        res.status(500).json({ error: "Internal Server Error" });
    }
};
// ACTION: Approve or Reject a specific step
export const updateApprovalStatus = async (req, res) => {
    try {
        const { id } = req.params; // The specific approval_step_id (trip_approvals table ID)
        const validation = validateRequest(approveActionSchema, req.body);
        if (!validation.isValid)
            return res.status(400).json({ errors: validation.errors });
        // Inject user info for audit trail
        const payload = {
            ...validation.value,
            approverUserId: req.user.id,
        };
        const result = await tripApprovalService.processApprovalAction(id, payload);
        res.json(result);
    }
    catch (error) {
        console.error("Controller Error:", error);
        if (error.message === "Approval step not found")
            return res.status(404).json({ error: error.message });
        if (error.message === "Request already processed")
            return res.status(400).json({ error: error.message });
        res.status(500).json({ error: "Internal Server Error" });
    }
};
//# sourceMappingURL=trip-approvals.controllers.js.map