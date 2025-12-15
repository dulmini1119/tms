import { Router } from "express";
import * as controller from "./cab-service.controller.js";
import { authenticate } from "../../middleware/auth.js";

const router = Router();
router.use(authenticate); // PROTECT ALL ROUTES

router.post("/", controller.createCabService);
router.get("/", controller.listCabServices);
router.put("/:id", controller.updateCabService);
router.delete("/:id", controller.deleteCabService);

export default router;
