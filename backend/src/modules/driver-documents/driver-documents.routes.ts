import { Router } from "express";
import {
  createDriverDocument,
  deleteDriverDocument,
  getAllDriverDocuments,
  getDriverOptions,
  getDriverDocuments,
  updateDriverDocument,
  uploadDriverDocumentMiddleware,
  verifyDriverDocument,
} from "./driver-documents.controller.js";
import { authenticate } from "../../middleware/auth.js";

const router = Router();

router.post(
  "/",
  authenticate,
  uploadDriverDocumentMiddleware,
  createDriverDocument
);

router.get(
  "/",
  authenticate,
  getAllDriverDocuments
);

router.get(
  "/drivers",
  authenticate,
  getDriverOptions
);

router.get(
  "/driver/:driverId",
  authenticate,
  getDriverDocuments
);

router.put(
  "/:id",
  authenticate,
  updateDriverDocument
);

router.patch(
  "/:id/verify",
  authenticate,
  verifyDriverDocument
);

router.delete(
  "/:id",
  authenticate,
  deleteDriverDocument
);

export default router;
