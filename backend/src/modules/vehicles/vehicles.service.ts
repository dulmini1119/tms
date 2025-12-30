import prisma from "../../config/database.js";
import { CreateVehicleDto, UpdateVehicleDto } from "./dto/index.js";
import { AppError } from "../../middleware/errorHandler.js";
import { ERROR_CODES, HTTP_STATUS } from "../../utils/constants.js";

export class VehiclesService {
  // CREATE VEHICLE
  async createVehicle(data: CreateVehicleDto, userId: string) {
    const exists = await prisma.vehicles.findUnique({
      where: { registration_number: data.registration_number },
    });

    if (exists) {
      throw new AppError(
        ERROR_CODES.ALREADY_EXISTS,
        "Vehicle already exists",
        HTTP_STATUS.CONFLICT
      );
    }

    return prisma.vehicles.create({
      data: {
        ...data,
        created_by: userId,
        operational_status: "Active",
        availability_status: "Available",
      },
    });
  }

  // GET ALL VEHICLES WITH OPTIONAL FILTERS
  async getVehicles(filter?: any) {
    const where: any = { deleted_at: null };

    if (filter) {
      // FIX: Added 'if' and correct property assignments
      if (filter.vehicle_type) where.vehicle_type = filter.vehicle_type;
      if (filter.availability_status) where.availability_status = filter.availability_status;
      if (filter.cab_service_id) where.cab_service_id = filter.cab_service_id;
      
      // FIX: Corrected object syntax for Prisma 'mode: insensitive'
      if (filter.ownership_type) where.ownership_type = { equals: filter.ownership_type, mode: "insensitive" };
    }

    const vehicles = await prisma.vehicles.findMany({
      where,
      include: {
        cab_services: true,
        drivers_vehicles_current_driver_idTodrivers: true,
      },
      orderBy: { created_at: "desc" },
    });

    // Ensure vehicle_type is always defined
    return vehicles.map(v => ({
      ...v,
      vehicle_type: v.vehicle_type || "UNKNOWN",
    }));
  }

  // GET VEHICLE BY ID
  async getVehicleById(id: string) {
    const vehicle = await prisma.vehicles.findFirst({
      where: { id, deleted_at: null },
      include: {
        cab_services: true,
        drivers_vehicles_current_driver_idTodrivers: true,
      },
    });

    if (!vehicle) {
      throw new AppError(
        ERROR_CODES.NOT_FOUND,
        "Vehicle not found",
        HTTP_STATUS.NOT_FOUND
      );
    }

    return {
      ...vehicle,
      vehicle_type: vehicle.vehicle_type || "UNKNOWN",
    };
  }

  // UPDATE VEHICLE
  async updateVehicle(id: string, data: UpdateVehicleDto, userId: string) {
    await this.getVehicleById(id);

    if (data.registration_number) {
      const exists = await prisma.vehicles.findFirst({
        where: {
          registration_number: data.registration_number,
          NOT: { id },
          deleted_at: null,
        },
      });

      if (exists) {
        throw new AppError(
          ERROR_CODES.ALREADY_EXISTS,
          "Registration number already in use",
          HTTP_STATUS.CONFLICT
        );
      }
    }

    const updated = await prisma.vehicles.update({
      where: { id },
      data: {
        ...data,
        updated_by: userId,
        updated_at: new Date(),
      },
    });

    return {
      ...updated,
      vehicle_type: updated.vehicle_type || "UNKNOWN",
    };
  }

  // DELETE VEHICLE
  async deleteVehicle(id: string, userId: string) {
    await this.getVehicleById(id);

    await prisma.vehicles.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        updated_by: userId,
      },
    });

    return { message: "Vehicle deleted successfully" };
  }
}