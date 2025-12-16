// src/modules/cab-agreement/cab-agreement.routes.ts
import { Router } from "express";
import * as controller from "./cab-agreements.controller.js";
import { authenticate } from "../../middleware/auth.js";

const router = Router();

// Apply authentication middleware to all routes in this file
router.use(authenticate);

router.post("/", controller.createAgreement);
router.get("/", controller.listAgreements);
router.get("/:id", controller.getAgreement);
router.put("/:id", controller.updateAgreement);
router.delete("/:id", controller.deleteAgreement);

export default router;