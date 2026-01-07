import { Router } from "express";
import * as tripAssignmentController from "./trip-assignments.controllers.js";
import { authenticate } from "../../middleware/auth.js";

const router = Router();

router.use(authenticate);

router
  .route("/")
  .get(tripAssignmentController.getAllTripAssignments)
  .post(tripAssignmentController.createAssignment);

router
  .route("/:id")
  .get(tripAssignmentController.getAssignmentById)
  .patch(tripAssignmentController.updateAssignment);

export default router;