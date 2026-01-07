import { Router } from "express";
import * as tripApprovalController from "./trip-approvals.controllers.js";
import { authenticate } from "../../middleware/auth.js"; // Assuming you have auth middleware

const router = Router();

router.use(authenticate); // Protect all routes

router
  .route("/")
  .get(tripApprovalController.getAllTripApprovals);

router
  .route("/:id")
  .get(tripApprovalController.getApprovalById)
  .patch(tripApprovalController.updateApprovalStatus);

export default router;