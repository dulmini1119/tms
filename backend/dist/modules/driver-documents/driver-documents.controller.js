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
export const uploadDriverDocumentMiddleware = upload.single("documentFile");
export const createDriverDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Document file is required." });
        }
        const filepath = `/uploads/driver-documents/${req.file.filename}`;
        const doc = await DriverDocumentsService.create({
            ...req.body,
            file_name: req.file.originalname,
            file_path: filepath,
            file_size: req.file.size,
            mime_type: req.file.mimetype,
            created_by: req.user.id,
        });
        return res.status(201).json({
            ...doc,
            file_size: doc.file_size ? doc.file_size.toString() : null,
        });
    }
    catch (error) {
        console.error("[CREATE DRIVER DOCUMENT ERROR]", error);
        return res.status(500).json({ message: "Failed to create driver document" });
    }
};
export const getDriverDocuments = async (req, res) => {
    try {
        const docs = await DriverDocumentsService.getByDriver(req.params.driverId);
        return res.json(docs.map((doc) => ({
            ...doc,
            file_size: doc.file_size ? doc.file_size.toString() : null,
        })));
    }
    catch (error) {
        console.error("[GET DRIVER DOCUMENTS ERROR]", error);
        return res.status(500).json({ message: "Failed to fetch driver documents" });
    }
};
export const getAllDriverDocuments = async (req, res) => {
    try {
        const docs = await DriverDocumentsService.getAll();
        return res.json(docs.map((doc) => ({
            ...doc,
            file_size: doc.file_size ? doc.file_size.toString() : null,
        })));
    }
    catch (error) {
        console.error("[GET ALL DRIVER DOCUMENTS ERROR]", error);
        return res.status(500).json({ message: "Failed to fetch driver documents" });
    }
};
export const getDriverOptions = async (req, res) => {
    try {
        const drivers = await DriverDocumentsService.getDriverOptions();
        return res.json(drivers);
    }
    catch (error) {
        console.error("[GET DRIVER OPTIONS ERROR]", error);
        return res.status(500).json({ message: "Failed to fetch drivers" });
    }
};
export const updateDriverDocument = async (req, res) => {
    try {
        const doc = await DriverDocumentsService.update(req.params.id, {
            ...req.body,
            updated_by: req.user.id,
        });
        return res.json({
            ...doc,
            file_size: doc.file_size ? doc.file_size.toString() : null,
        });
    }
    catch (error) {
        console.error("[UPDATE DRIVER DOCUMENT ERROR]", error);
        return res.status(500).json({ message: "Failed to update driver document" });
    }
};
export const verifyDriverDocument = async (req, res) => {
    try {
        const doc = await DriverDocumentsService.verify(req.params.id, req.user.id);
        return res.json({
            ...doc,
            file_size: doc.file_size ? doc.file_size.toString() : null,
        });
    }
    catch (error) {
        console.error("[VERIFY DRIVER DOCUMENT ERROR]", error);
        return res.status(500).json({ message: "Failed to verify driver document" });
    }
};
export const deleteDriverDocument = async (req, res) => {
    try {
        await DriverDocumentsService.delete(req.params.id, req.user.id);
        return res.status(204).send();
    }
    catch (error) {
        console.error("[DELETE DRIVER DOCUMENT ERROR]", error);
        return res.status(500).json({ message: "Failed to delete driver document" });
    }
};
//# sourceMappingURL=driver-documents.controller.js.map