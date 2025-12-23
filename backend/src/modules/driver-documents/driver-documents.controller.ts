import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.js";
import { DriverDocumentsService } from "./driver-documents.service.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const uploadFolder = path.join(process.cwd(), "uploads/driver-documents");

if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadFolder),
  filename: (_, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + unique + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

export const createDriverDocument = [
  upload.single("documentFile"),
  async (req: AuthRequest, res: Response) => {
    const filepath = req.file
      ? `/uploads/driver-documents/${req.file.filename}`
      : null;

    const doc = await DriverDocumentsService.create({
      ...req.body,
      file_path: filepath,
      created_by: req.user!.id,
    });

    res.status(201).json(doc);
  },
];

export const getDriverDocuments = async (
  req: AuthRequest<{ driverId: string }>,
  res: Response
) => {
  const docs = await DriverDocumentsService.getByDriver(req.params.driverId);
  res.json(docs);
};
