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
  validateQuery,
} from "../../middleware/validation.js";
import {
  createVehicleSchema,
  getVehiclesQuerySchema,
  updateVehicleSchema,
} from "./vehicles.validation.js";
import { authenticate, AuthRequest } from "../../middleware/auth.js";
import Joi from "joi";
import prisma from "../../config/database.js";

const router = Router();

/**
 * Params schema for :id
 */
const idParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
});


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

router.get(
  "/",
  authenticate,
  validateQuery(getVehiclesQuerySchema),
  getVehicles
)

// GET maintenance logs for a vehicle
router.get("/:vehicleId/maintenance-logs", authenticate, async (req, res) => {
  const logs = await prisma.maintenance_logs.findMany({
    where: { vehicle_id: req.params.vehicleId },
    orderBy: { scheduled_date: "desc" },
    include: { maintenance_parts: true }
  });
  res.json(logs);
});

// CREATE maintenance log for a vehicle
router.post("/:vehicleId/maintenance-logs", authenticate, async (req: AuthRequest, res) => {
  const log = await prisma.maintenance_logs.create({
    data: {
      ...req.body,
      vehicle_id: req.params.vehicleId,
      created_by: req.user!.id,
    },
  });
  res.status(201).json(log);
});


export default router;
