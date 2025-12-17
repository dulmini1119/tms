import { Response } from "express";
import { VehiclesService } from "./vehicles.service.js";
import { AuthRequest } from "../../middleware/auth.js";

const service = new VehiclesService();

// CREATE
export const createVehicle = async (
  req: AuthRequest,
  res: Response
) => {
  const vehicle = await service.createVehicle(req.body, req.user!.id);
  res.status(201).json(vehicle);
};

// GET ALL
export const getVehicles = async (
  _req: AuthRequest,
  res: Response
) => {
  const vehicles = await service.getVehicles();
  res.json(vehicles);
};

// GET BY ID
export const getVehicleById = async (
  req: AuthRequest<{ id: string }>,
  res: Response
) => {
  const vehicle = await service.getVehicleById(req.params.id);
  res.json(vehicle);
};

// UPDATE
export const updateVehicle = async (
  req: AuthRequest<{ id: string }, any, any>,
  res: Response
) => {
  const vehicle = await service.updateVehicle(
    req.params.id,
    req.body,
    req.user!.id
  );
  res.json(vehicle);
};

// DELETE
export const deleteVehicle = async (
  req: AuthRequest<{ id: string }>,
  res: Response
) => {
  const result = await service.deleteVehicle(
    req.params.id,
    req.user!.id
  );
  res.json(result);
};
