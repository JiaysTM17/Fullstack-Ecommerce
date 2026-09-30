/**
 * Notification Service — Quản lý thông báo người mua (Client)
 * Tích hợp trực tiếp với /api/notifications kèm fallback localStorage đồng bộ 2 chiều
 */
import { apiRequest } from "./api";

const NOTIFICATIONS_STORAGE_KEY = "mini_shopee_buyer_notifications";

function getLocalNotifications() {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalNotifications(list) {
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent("mini_shopee_notifications_updated", { detail: { list } }));
  } catch {}
}

export async function getNotifications(page = 1, limit = 20, type = "") {
  try {
    const query = new URLSearchParams({ page, limit, ...(type ? { type } : {}) }).toString();
    const res = await apiRequest(`/api/notifications?${query}`);
    if (res?.data?.notifications) {
      saveLocalNotifications(res.data.notifications);
      return res.data;
    }
  } catch (err) {
    // offline fallback
  }

  const list = getLocalNotifications();
  const filtered = type ? list.filter((n) => n.type === type) : list;
  const unreadCount = filtered.filter((n) => !n.isRead).length;
  return {
    notifications: filtered,
    unreadCount,
    pagination: { page, limit, total: filtered.length, totalPages: 1 },
  };
}

export async function getUnreadCount() {
  try {
    const res = await apiRequest("/api/notifications/unread-count");
    if (res?.data?.unreadCount !== undefined) {
      return res.data.unreadCount;
    }
  } catch (err) {
    // offline fallback
  }

  const list = getLocalNotifications();
  return list.filter((n) => !n.isRead).length;
}

export async function markNotificationAsRead(id) {
  try {
    const res = await apiRequest(`/api/notifications/${id}/read`, { method: "PATCH" });
    if (res?.data) {
      return res.data;
    }
  } catch (err) {
    // offline fallback
  }

  const list = getLocalNotifications();
  const item = list.find((n) => n.id === id || n._id === id);
  if (item) {
    item.isRead = true;
    saveLocalNotifications(list);
  }
  return { success: true };
}

export async function markAllNotificationsAsRead() {
  try {
    const res = await apiRequest("/api/notifications/read-all", { method: "PATCH" });
    if (res?.data) {
      return res.data;
    }
  } catch (err) {
    // offline fallback
  }

  const list = getLocalNotifications();
  list.forEach((n) => {
    n.isRead = true;
  });
  saveLocalNotifications(list);
  return { success: true, unreadCount: 0 };
}

export async function deleteNotification(id) {
  try {
    await apiRequest(`/api/notifications/${id}`, { method: "DELETE" });
  } catch {}

  const list = getLocalNotifications();
  const filtered = list.filter((n) => n.id !== id && n._id !== id);
  saveLocalNotifications(filtered);
  return { success: true };
}

export function pushNotification(payload) {
  const list = getLocalNotifications();
  const notif = {
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    title: payload.title || "Thông báo",
    message: payload.message || "",
    type: payload.type || "system", // 'order' | 'promotion' | 'voucher' | 'system'
    icon: payload.icon || "🔔",
    link: payload.link || null,
    isRead: false,
    createdAt: new Date().toISOString(),
  };
  list.unshift(notif);
  if (list.length > 50) list.length = 50;
  saveLocalNotifications(list);
  return notif;
}

export default {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  pushNotification,
};
