// src/modules/cab-agreement/cab-agreement.controller.ts
import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.js";
import { CabAgreementsService } from "./cab-agreements.services.js"; // Using the import as specified by user
import { createAgreementSchema, updateAgreementSchema } from "./cab-agreements.validation.js";
import multer from "multer";
import path from "path";
import fs from "fs";
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

// File filter to only accept specific document types
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF and Word documents are allowed.'));
  }
};

const upload = multer({ 
  storage: storage, 
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter
});

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
      
      // Format the response for the frontend
      const formatted = {
        ...agreement,
        cab_service_name: agreement.cab_services.name,
        contract_value: agreement.contract_value ? Number(agreement.contract_value) : null,
        security_deposit: agreement.security_deposit ? Number(agreement.security_deposit) : null,
        insurance_amount: agreement.insurance_amount ? Number(agreement.insurance_amount) : null,
        sla_availability_percentage: agreement.sla_availability_percentage ? Number(agreement.sla_availability_percentage) : null,
        sla_on_time_performance: agreement.sla_on_time_performance ? Number(agreement.sla_on_time_performance) : null,
      };
      
      res.status(201).json(formatted);
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
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const result = await CabAgreementsService.findMany(req.query, page, limit);
    
    // Format the response for the frontend
    const formatted = result.data.map((a) => ({
      ...a,
      cab_service_name: a.cab_services.name,
      contract_value: a.contract_value ? Number(a.contract_value) : null,
      security_deposit: a.security_deposit ? Number(a.security_deposit) : null,
      insurance_amount: a.insurance_amount ? Number(a.insurance_amount) : null,
      sla_availability_percentage: a.sla_availability_percentage ? Number(a.sla_availability_percentage) : null,
      sla_on_time_performance: a.sla_on_time_performance ? Number(a.sla_on_time_performance) : null,
    }));
    
    res.json({
      data: formatted,
      pagination: result.pagination
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch agreements" });
  }
};

export const getAgreement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const agreement = await CabAgreementsService.findById(req.params.id);
    
    if (!agreement) {
      res.status(404).json({ message: "Agreement not found" });
      return;
    }
    
    // Format the response for the frontend
    const formatted = {
      ...agreement,
      cab_service_name: agreement.cab_services.name,
      contract_value: agreement.contract_value ? Number(agreement.contract_value) : null,
      security_deposit: agreement.security_deposit ? Number(agreement.security_deposit) : null,
      insurance_amount: agreement.insurance_amount ? Number(agreement.insurance_amount) : null,
      sla_availability_percentage: agreement.sla_availability_percentage ? Number(agreement.sla_availability_percentage) : null,
      sla_on_time_performance: agreement.sla_on_time_performance ? Number(agreement.sla_on_time_performance) : null,
    };
    
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch agreement" });
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
      
      // Get the old agreement to find the old document URL
      const oldAgreement = await CabAgreementsService.findById(req.params.id);
      
      if (!oldAgreement) {
        res.status(404).json({ message: "Agreement not found" });
        return;
      }
      
      const documentUrl = req.file ? `/uploads/agreements/${req.file.filename}` : undefined;
      
      // Update the agreement
      const agreement = await CabAgreementsService.update(req.params.id, value, req.user!.id, documentUrl);
      
      // Delete the old file if a new one was uploaded
      if (req.file && oldAgreement.document_url) {
        const oldFilePath = path.join(process.cwd(), oldAgreement.document_url);
        fs.unlink(oldFilePath, (err) => {
          if (err) console.error('Failed to delete old file:', err);
        });
      }
      
      // Format the response for the frontend
      const formatted = {
        ...agreement,
        cab_service_name: agreement.cab_services.name,
        contract_value: agreement.contract_value ? Number(agreement.contract_value) : null,
        security_deposit: agreement.security_deposit ? Number(agreement.security_deposit) : null,
        insurance_amount: agreement.insurance_amount ? Number(agreement.insurance_amount) : null,
        sla_availability_percentage: agreement.sla_availability_percentage ? Number(agreement.sla_availability_percentage) : null,
        sla_on_time_performance: agreement.sla_on_time_performance ? Number(agreement.sla_on_time_performance) : null,
      };
      
      res.json(formatted);
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
    // Check if the agreement exists before attempting to delete
    const agreement = await CabAgreementsService.findById(req.params.id);
    
    if (!agreement) {
      res.status(404).json({ message: "Agreement not found" });
      return;
    }
    
    await CabAgreementsService.softDelete(req.params.id);
    
    // Delete the associated file if it exists
    if (agreement.document_url) {
      const filePath = path.join(process.cwd(), agreement.document_url);
      fs.unlink(filePath, (err) => {
        if (err) console.error('Failed to delete file:', err);
      });
    }
    
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