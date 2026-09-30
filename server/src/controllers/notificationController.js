/**
 * Notification Controller — Quản lý thông báo hệ thống
 */
import { sendSuccess, sendError } from "../utils/response.js";

// In-memory notification store
const notificationStore = new Map();
let notifIdCounter = 1;

/**
 * Helper: Tạo thông báo cho user (dùng nội bộ)
 */
export const createNotification = (userId, { type = "system", title, message, orderId, productId, icon }) => {
  const notifications = notificationStore.get(userId) || [];
  const notif = {
    id: `notif-${notifIdCounter++}`,
    type,
    title,
    message,
    orderId: orderId || null,
    productId: productId || null,
    icon: icon || getDefaultIcon(type),
    isRead: false,
    createdAt: new Date().toISOString(),
  };
  notifications.unshift(notif);

  // Giới hạn tối đa 200 thông báo
  if (notifications.length > 200) {
    notifications.length = 200;
  }

  notificationStore.set(userId, notifications);
  return notif;
};

function getDefaultIcon(type) {
  const icons = {
    order: "📦",
    promotion: "🎉",
    voucher: "🎫",
    system: "🔔",
    shipping: "🚚",
    review: "⭐",
    coin: "🪙",
    warning: "⚠️",
  };
  return icons[type] || "🔔";
}

// @desc    Get user's notifications (paginated)
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { page = 1, limit = 20, type } = req.query;

    let notifications = notificationStore.get(userId) || [];

    // Filter by type if specified
    if (type) {
      notifications = notifications.filter((n) => n.type === type);
    }

    const total = notifications.length;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const start = (pageNum - 1) * limitNum;
    const paged = notifications.slice(start, start + limitNum);

    const unreadCount = (notificationStore.get(userId) || []).filter((n) => !n.isRead).length;

    sendSuccess(res, {
      notifications: paged,
      unreadCount,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const notifications = notificationStore.get(userId) || [];
    const unreadCount = notifications.filter((n) => !n.isRead).length;

    sendSuccess(res, { unreadCount });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Mark single notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
export const markAsRead = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;

    const notifications = notificationStore.get(userId) || [];
    const notif = notifications.find((n) => n.id === id);

    if (!notif) {
      return sendError(res, "Không tìm thấy thông báo", 404);
    }

    notif.isRead = true;
    sendSuccess(res, { message: "Đã đánh dấu đã đọc", notification: notif });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const notifications = notificationStore.get(userId) || [];

    let count = 0;
    for (const notif of notifications) {
      if (!notif.isRead) {
        notif.isRead = true;
        count++;
      }
    }

    sendSuccess(res, { message: `Đã đánh dấu ${count} thông báo đã đọc`, markedCount: count });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;

    let notifications = notificationStore.get(userId) || [];
    const initialLen = notifications.length;
    notifications = notifications.filter((n) => n.id !== id);

    if (notifications.length === initialLen) {
      return sendError(res, "Không tìm thấy thông báo", 404);
    }

    notificationStore.set(userId, notifications);
    sendSuccess(res, { message: "Đã xóa thông báo" });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Delete all notifications
// @route   DELETE /api/notifications
// @access  Private
export const clearAllNotifications = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    notificationStore.set(userId, []);
    sendSuccess(res, { message: "Đã xóa toàn bộ thông báo" });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

export default {
  createNotification,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
};
