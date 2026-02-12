import { VehiclesService } from "./vehicles.service.js";
const service = new VehiclesService();
// CREATE
export const createVehicle = async (req, res) => {
    const vehicle = await service.createVehicle(req.body, req.user.id);
    res.status(201).json(vehicle);
};
// GET ALL
export const getVehicles = async (_req, res) => {
    try {
        const vehicles = await service.getVehicles(_req.query);
        res.json(vehicles);
    }
    catch (err) { // <--- FIXED: Changed "err : any" to "err: any"
        res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
    }
};
// GET BY ID
export const getVehicleById = async (req, res) => {
    const vehicle = await service.getVehicleById(req.params.id);
    res.json(vehicle);
};
// UPDATE
export const updateVehicle = async (req, res) => {
    const vehicle = await service.updateVehicle(req.params.id, req.body, req.user.id);
    res.json(vehicle);
};
// DELETE
export const deleteVehicle = async (req, res) => {
    const result = await service.deleteVehicle(req.params.id, req.user.id);
    res.json(result);
};
//# sourceMappingURL=vehicles.controller.js.map