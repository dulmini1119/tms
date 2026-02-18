import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import {
  assignVehicleAdminTrip,
  endDriverTrip,
  getDriverAssignments,
  getDriverDashboard,
  getDriverProfile,
  getDriverTripLogs,
  getTeamApprovalNotifications,
  getTeamApprovalQueue,
  getTeamDashboard,
  getVehicleAdminApprovedTrips,
  getVehicleAdminAssignments,
  getVehicleAdminDashboard,
  getVehicleAdminProfile,
  processTeamApprovalAction,
  startDriverTrip,
} from "./portal.controller.js";

const router = Router();

router.use(authenticate);

router.get("/driver/dashboard", getDriverDashboard);
router.get("/driver/assignments", getDriverAssignments);
router.patch("/driver/assignments/:id/start", startDriverTrip);
router.patch("/driver/assignments/:id/end", endDriverTrip);
router.get("/driver/trip-logs", getDriverTripLogs);
router.get("/driver/profile", getDriverProfile);

router.get("/team/dashboard", getTeamDashboard);
router.get("/team/approvals", getTeamApprovalQueue);
router.get("/team/approvals/notifications", getTeamApprovalNotifications);
router.post("/team/approvals/:id/action", processTeamApprovalAction);

router.get("/vehicle-admin/dashboard", getVehicleAdminDashboard);
router.get("/vehicle-admin/profile", getVehicleAdminProfile);
router.get("/vehicle-admin/approved-trips", getVehicleAdminApprovedTrips);
router.get("/vehicle-admin/assignments", getVehicleAdminAssignments);
router.post("/vehicle-admin/assign", assignVehicleAdminTrip);

export default router;
