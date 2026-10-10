import express from "express";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  broadcastNotification,
} from "../controllers/notificationController.js";
import { authenticate, authorize } from "../middlewares/auth.js";

const router = express.Router();

// All notification routes require authentication
router.use(authenticate);

router.get("/", getNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/read-all", markAllAsRead);
router.patch("/:id/read", markAsRead);
router.delete("/:id", deleteNotification);
router.delete("/", clearAllNotifications);

// Admin-only broadcast
router.post("/broadcast", authorize("admin"), broadcastNotification);

export default router;
