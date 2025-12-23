import { Router } from "express";
import {
  createVehicle,
  getVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
} from "./vehicles.controller.js";
import {
  validateBody,
  validateParams,
} from "../../middleware/validation.js";
import {
  createVehicleSchema,
  updateVehicleSchema,
} from "./vehicles.validation.js";
import { authenticate } from "../../middleware/auth.js";
import Joi from "joi";

const router = Router();

/**
 * Params schema for :id
 */
const idParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

// GET ALL
router.get("/", authenticate, getVehicles);

// GET BY ID
router.get(
  "/:id",
  authenticate,
  validateParams(idParamSchema),
  getVehicleById
);

// CREATE
router.post(
  "/",
  authenticate,
  validateBody(createVehicleSchema),
  createVehicle
);

// UPDATE
router.put(
  "/:id",
  authenticate,
  validateParams(idParamSchema),
  validateBody(updateVehicleSchema),
  updateVehicle
);

// DELETE
router.delete(
  "/:id",
  authenticate,
  validateParams(idParamSchema),
  deleteVehicle
);

export default router;
