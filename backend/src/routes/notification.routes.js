import { Router } from "express";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../controllers/notification.controller.js";
import { asyncHandler } from "../middleware/error.middleware.js";

const router = Router();

router.get("/", asyncHandler(getNotifications));
router.patch("/:id/read", asyncHandler(markNotificationRead));
router.patch("/read-all", asyncHandler(markAllNotificationsRead));

export default router;
