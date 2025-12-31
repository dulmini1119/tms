import { Router } from "express";
import {
  createVehicleDocument,
  getVehicleDocuments,
  deleteVehicleDocument,
  uploadVehicleDocumentMiddleware,
  getAllVehicleDocuments, // Import middleware
} from "./vehicle-documents.controller.js";
import { validateBody } from "../../middleware/validation.js";
import { createVehicleDocumentSchema } from "./vehicle-documents.validation.js";
import { authenticate } from "../../middleware/auth.js";

const router = Router();

// ── CREATE ──
router.post(
  "/",
  authenticate,
  uploadVehicleDocumentMiddleware,
  createVehicleDocument
);

// ── GET ALL (THIS WAS MISSING) ──
// This fixes the 404 error when fetching the main list
router.get(
  "/",
  authenticate,
  getAllVehicleDocuments
);

// ── GET BY VEHICLE ──
// This is used if you want to filter by vehicle ID directly via API
router.get(
  "/vehicle/:vehicleId",
  authenticate,
  getVehicleDocuments
);

// ── DELETE ──
router.delete(
  "/:id",
  authenticate,
  deleteVehicleDocument
);

export default router;