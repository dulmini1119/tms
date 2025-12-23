import { Router } from "express";
import {
  createDriverDocument,
  getDriverDocuments,
} from "./driver-documents.controller.js";
import { validateBody } from "../../middleware/validation.js";
import { createDriverDocumentSchema } from "./driver-documents.validation.js";
import { authenticate } from "../../middleware/auth.js";

const router = Router();

router.post(
  "/",
  authenticate,
  validateBody(createDriverDocumentSchema),
  createDriverDocument
);

router.get(
  "/driver/:driverId",
  authenticate,
  getDriverDocuments
);

export default router;
