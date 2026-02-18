import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import {
  endDriverTrip,
  getDriverAssignments,
  getDriverDashboard,
  getDriverProfile,
  getDriverTripLogs,
  getTeamDashboard,
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

export default router;

