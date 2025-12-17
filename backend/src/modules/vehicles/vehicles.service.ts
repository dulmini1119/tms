import prisma from "../../config/database.js";
import { CreateVehicleDto, UpdateVehicleDto } from "./dto/index.js";
import { AppError } from "../../middleware/errorHandler.js";
import { ERROR_CODES, HTTP_STATUS } from "../../utils/constants.js";

export class VehiclesService {
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

  async getVehicles() {
    return prisma.vehicles.findMany({
      where: { deleted_at: null },
      include: {
        cab_services: true,
        drivers_vehicles_current_driver_idTodrivers: true,
      },
      orderBy: { created_at: "desc" },
    });
  }

  async getVehicleById(id: string) {
    const vehicle = await prisma.vehicles.findUnique({ where: { id } });

    if (!vehicle || vehicle.deleted_at) {
      throw new AppError(
        ERROR_CODES.NOT_FOUND,
        "Vehicle not found",
        HTTP_STATUS.NOT_FOUND
      );
    }

    return vehicle;
  }

  async updateVehicle(id: string, data: UpdateVehicleDto, userId: string) {
    await this.getVehicleById(id);

    return prisma.vehicles.update({
      where: { id },
      data: {
        ...data,
        updated_by: userId,
      },
    });
  }

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
