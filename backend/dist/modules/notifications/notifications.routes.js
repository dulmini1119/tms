import { Router } from "express";
import * as notificationController from "./notifications.controller.js";
import { authenticate } from "../../middleware/auth.js";
const router = Router();
router.use(authenticate);
router
    .route("/")
    .get(notificationController.getNotifications)
    .post(notificationController.createNotification);
router
    .route("/:id")
    .get(notificationController.getNotificationById)
    .patch(notificationController.updateNotification)
    .delete(notificationController.deleteNotification);
export default router;
//# sourceMappingURL=notifications.routes.js.map