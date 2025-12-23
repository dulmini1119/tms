import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.js";
import { VehicleDocumentsService } from "./vehicle-documents.service.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const uploadFolder = path.join(process.cwd(), "uploads/vehicle-documents");

if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder, { recursive: true });
}

// ── Multer config ─────────────────────────────
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadFolder),
  filename: (_, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + unique + path.extname(file.originalname));
  },
});

const fileFilter: multer.Options["fileFilter"] = (_, file, cb) => {
  const allowed = [
    "application/pdf",
    "image/jpeg",
    "image/png",
  ];
  cb(null, allowed.includes(file.mimetype));
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

// ── CREATE ───────────────────────────────────
export const createVehicleDocument = [
  upload.single("documentFile"),
  async (req: AuthRequest, res: Response) => {
    const filePath = req.file
      ? `/uploads/vehicle-documents/${req.file.filename}`
      : null;

    const doc = await VehicleDocumentsService.create({
      ...req.body,
      file_path: filePath,
      created_by: req.user!.id,
    });

    res.status(201).json(doc);
  },
];

// ── GET BY VEHICLE ───────────────────────────
export const getVehicleDocuments = async (
  req: AuthRequest<{ vehicleId: string }>,
  res: Response
) => {
  const docs = await VehicleDocumentsService.getByVehicle(req.params.vehicleId);
  res.json(docs);
};

// ── DELETE ───────────────────────────────────
export const deleteVehicleDocument = async (
  req: AuthRequest<{ id: string }>,
  res: Response
) => {
  const doc = await VehicleDocumentsService.delete(req.params.id);

  if (doc?.file_path) {
    const filePath = path.join(process.cwd(), doc.file_path);
    fs.unlink(filePath, (err) => {
        if (err) console.error("Error deleting file:", err);
    });
  }

  res.status(204).send();
};
