import { Router } from "express";
import {
  createVehicleDocument,
  getVehicleDocuments,
  deleteVehicleDocument,
} from "./vehicle-documents.controller.js";
import { validateBody } from "../../middleware/validation.js";
import { createVehicleDocumentSchema } from "./vehicle-documents.validation.js";
import { authenticate } from "../../middleware/auth.js";

const router = Router();

router.post(
  "/",
  authenticate,
  validateBody(createVehicleDocumentSchema),
  createVehicleDocument
);

router.get(
  "/vehicle/:vehicleId",
  authenticate,
  getVehicleDocuments
);

router.delete(
  "/:id",
  authenticate,
  deleteVehicleDocument
);

export default router;
