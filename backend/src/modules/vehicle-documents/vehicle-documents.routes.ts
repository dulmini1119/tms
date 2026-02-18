import { Router } from "express";
import {
  createVehicleDocument,
  downloadVehicleDocument,
  getVehicleDocuments,
  deleteVehicleDocument,
  uploadVehicleDocumentMiddleware,
  getAllVehicleDocuments,
  renewVehicleDocument,
  updateVehicleDocument,
  verifyVehicleDocument,
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
  uploadVehicleDocumentMiddleware,
  updateVehicleDocument
);

router.patch(
  "/:id/verify",
  authenticate,
  verifyVehicleDocument
);

router.patch(
  "/:id/renew",
  authenticate,
  renewVehicleDocument
);

router.get(
  "/:id/download",
  authenticate,
  downloadVehicleDocument
);

router.delete(
  "/:id",
  authenticate,
  deleteVehicleDocument
);

export default router;
