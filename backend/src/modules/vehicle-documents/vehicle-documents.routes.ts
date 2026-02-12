import { Router } from "express";
import {
  createVehicleDocument,
  getVehicleDocuments,
  deleteVehicleDocument,
  uploadVehicleDocumentMiddleware,
  getAllVehicleDocuments,
  updateVehicleDocument,
} from "./vehicle-documents.controller.js";
import { authenticate } from "../../middleware/auth.js";

const router = Router();

router.post(
  "/",
  authenticate,
  uploadVehicleDocumentMiddleware,
  createVehicleDocument
);

router.get(
  "/",
  authenticate,
  getAllVehicleDocuments
);

router.get(
  "/vehicle/:vehicleId",
  authenticate,
  getVehicleDocuments
);

router.put(
  "/:id",
  authenticate,
  updateVehicleDocument
);

router.delete(
  "/:id",
  authenticate,
  deleteVehicleDocument
);

export default router;