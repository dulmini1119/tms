// src/modules/cab-agreement/cab-agreement.controller.ts
import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.js";
import { CabAgreementsService } from "./cab-agreements.services.js";
import { createAgreementSchema, updateAgreementSchema } from "./cab-agreements.validation.js";
import multer from "multer";
import path from "path";
import { Prisma } from "@prisma/client";

// --- Configure Multer for file uploads ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/agreements/"); // Ensure this folder exists
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

// --- Controller Functions ---

export const createAgreement = [
  upload.single("documentFile"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { error, value } = createAgreementSchema.validate(req.body);
      if (error) {
        res.status(400).json({ message: "Invalid request data", details: error.details });
        return;
      }
      const documentUrl = req.file ? `/uploads/agreements/${req.file.filename}` : null;
      const agreement = await CabAgreementsService.create(value, req.user!.id, documentUrl);
      res.status(201).json(agreement);
    } catch (error: any) {
      console.error(error);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        res.status(409).json({ message: "Agreement number already exists." });
        return;
      }
      res.status(500).json({ message: "Failed to create agreement" });
    }
  },
];

export const listAgreements = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const agreements = await CabAgreementsService.findMany(req.query);
    // Format the response for the frontend
    const formatted = agreements.map((a) => ({
      ...a,
      cab_service_name: a.cab_services.name,
      // Convert Decimal to Number for JSON serialization
      contract_value: a.contract_value ? Number(a.contract_value) : null,
      security_deposit: a.security_deposit ? Number(a.security_deposit) : null,
      insurance_amount: a.insurance_amount ? Number(a.insurance_amount) : null,
      sla_availability_percentage: a.sla_availability_percentage ? Number(a.sla_availability_percentage) : null,
      sla_on_time_performance: a.sla_on_time_performance ? Number(a.sla_on_time_performance) : null,
    }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch agreements" });
  }
};

export const updateAgreement = [
  upload.single("documentFile"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { error, value } = updateAgreementSchema.validate(req.body);
      if (error) {
        res.status(400).json({ message: "Invalid request data", details: error.details });
        return;
      }
      const documentUrl = req.file ? `/uploads/agreements/${req.file.filename}` : undefined;
      if (documentUrl !== undefined) {
        value.document_url = documentUrl;
      }
      const agreement = await CabAgreementsService.update(req.params.id, value, req.user!.id, documentUrl);
      res.json(agreement);
    } catch (error: any) {
      console.error(error);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        res.status(404).json({ message: "Agreement not found." });
        return;
      }
      res.status(500).json({ message: "Failed to update agreement" });
    }
  },
];

export const deleteAgreement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await CabAgreementsService.softDelete(req.params.id);
    res.status(204).send(); // No Content
  } catch (error: any) {
    console.error(error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      res.status(404).json({ message: "Agreement not found." });
      return;
    }
    res.status(500).json({ message: "Failed to delete agreement" });
  }
};