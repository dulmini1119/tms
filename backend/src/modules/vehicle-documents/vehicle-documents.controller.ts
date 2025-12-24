import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.js";
import { VehicleDocumentsService } from "./vehicle-documents.service.js";
import multer from "multer";
import path from "path";
import fs from "fs";

// ── Multer Config ──
const uploadFolder = path.join(process.cwd(), "uploads", "vehicle-documents");
if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadFolder),
  filename: (_, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + unique + path.extname(file.originalname));
  },
});

const fileFilter: multer.Options["fileFilter"] = (_, file, cb) => {
  const allowed = ["application/pdf", "image/jpeg", "image/png"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only PDF, JPEG, and PNG are allowed."));
  }
};

// Export the middleware separately so we can place it before validation in routes
export const uploadVehicleDocumentMiddleware = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
}).single("documentFile");

// ── CREATE ──
export const createVehicleDocument = async (req: AuthRequest, res: Response) => {
  try {
    // File is attached by the middleware running before this handler
    if (!req.file) {
      return res.status(400).json({ message: "Document file is required." });
    }

    // FIX: Use relative path for storage to ensure correct deletion later
    // The absolute path on disk is handled by multer, but we store relative in DB
    const filePath = path.join("uploads", "vehicle-documents", req.file.filename);

    const doc = await VehicleDocumentsService.create({
      ...req.body,
      file_path: filePath,
      file_name: req.file.originalname,
      file_size: req.file.size,
      mime_type: req.file.mimetype,
      created_by: req.user!.id,
    });

    res.status(201).json(doc);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create document." });
  }
};

// ── GET BY VEHICLE ──
export const getVehicleDocuments = async (
  req: AuthRequest<{ vehicleId: string }>,
  res: Response
) => {
  try {
    const docs = await VehicleDocumentsService.getByVehicle(req.params.vehicleId);
    res.json(docs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch documents." });
  }
};

// ── DELETE ──
export const deleteVehicleDocument = async (
  req: AuthRequest<{ id: string }>,
  res: Response
) => {
  try {
    const doc = await VehicleDocumentsService.delete(req.params.id);

    if (doc?.file_path) {
      try {
        // FIX: Construct path correctly. If DB has relative "uploads/...", this joins correctly with CWD
        const fullPath = path.join(process.cwd(), doc.file_path);
        await fs.promises.unlink(fullPath);
      } catch (err) {
        console.error("Error deleting file from disk:", err);
        // Decide if you want to return an error here. 
        // Usually, we log it and proceed since the DB record is "deleted" (soft delete).
      }
    }

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete document." });
  }
};