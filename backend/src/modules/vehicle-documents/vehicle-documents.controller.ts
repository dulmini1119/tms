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
    if (!req.file) {
      return res.status(400).json({ message: "Document file is required." });
    }

    // Extract vehicle ID from form data (match whatever name your frontend sends)
    const vehicleId = req.body.vehicle_id || req.body.vehicle || req.body.vehicleId;

    if (!vehicleId) {
      return res.status(400).json({ 
        message: "Vehicle ID is required (sent as 'vehicle_id' or 'vehicle' in form data)" 
      });
    }

    // Basic UUID check
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(vehicleId)) {
      return res.status(400).json({ message: "Invalid vehicle ID format (must be UUID)." });
    }

    const filePath = path.join("uploads", "vehicle-documents", req.file.filename);

    const payload = {
      entity_type:        "VEHICLE",
      entity_id:          vehicleId,                          // ← THIS LINE MUST BE HERE
      document_type:      req.body.document_type      || null,
      document_number:    req.body.document_number    || null,
      issue_date:         req.body.issue_date         ? new Date(req.body.issue_date) : null,
      expiry_date:        req.body.expiry_date        ? new Date(req.body.expiry_date) : null,
      issuing_authority:  req.body.issuing_authority  || null,
      file_name:          req.file.originalname,
      file_path:          filePath,
      file_size:          req.file.size,
      mime_type:          req.file.mimetype,
      status:             "Valid",
      verification_status: null,
      verified_by:        null,
      verified_at:        null,
      created_by:         req.user!.id,
      updated_by:         req.user!.id,
      replaces_document_id: null,
      notes:              req.body.notes              || null,
    };

    // DEBUG: Log exactly what Prisma will receive
    console.log("[CREATE DOCUMENT PAYLOAD]", JSON.stringify(payload, null, 2));

    const doc = await VehicleDocumentsService.create(payload);
    const safeDoc = {
      ...doc,
      file_size: doc.file_size ? doc.file_size.toString() : null,
    }
    res.status(201).json(safeDoc);
  } catch (error: any) {
    console.error("[CREATE DOCUMENT ERROR]", error);
    res.status(500).json({
      message: "Failed to create document",
      error: error.message || "Unknown error",
      details: error instanceof Error ? error.stack : null
    });
  }
};

// ── GET BY VEHICLE ──
// ── GET BY VEHICLE ──
export const getVehicleDocuments = async (
  req: AuthRequest<{ vehicleId: string }>,
  res: Response
) => {
  try {
    const docs = await VehicleDocumentsService.getByVehicle(req.params.vehicleId);

    // FIX: Convert any BigInt fields (file_size) to string or number
    const safeDocs = docs.map(doc => ({
      ...doc,
      file_size: doc.file_size ? doc.file_size.toString() : null,   // BigInt → string (safe for large values)
      // Add other BigInt fields here if you have them
    }));

    res.json(safeDocs);
  } catch (error) {
    console.error("[GET DOCUMENTS ERROR]", error);
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