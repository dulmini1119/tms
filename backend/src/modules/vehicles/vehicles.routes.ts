import { Router } from "express";
import {
  createVehicle,
  getVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
} from "./vehicles.controller.js";
import { validateBody, validateQuery, validateParams } from "../../middleware/validation.js";
import {
  createVehicleSchema,
  updateVehicleSchema,
} from "./vehicles.validation.js";
import { authenticate } from "../../middleware/auth.js";

const router = Router();

router.get("/", getVehicles);
router.get("/:id", getVehicleById);
router.post("/", validateBody(createVehicleSchema), authenticate, createVehicle);
router.put("/:id", validateParams(updateVehicleSchema), authenticate, updateVehicle);
router.delete("/:id", deleteVehicle);

export default router;
