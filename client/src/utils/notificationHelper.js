/**
 * Notification Helper — Utility to push real-time notifications for buyers
 */

const NOTIFS_STORAGE_KEY = 'mini_shopee_notifications';

export function pushBuyerNotification({
  type = 'order',
  icon = 'package',
  title,
  message,
  link = '/orders',
}) {
  try {
    const raw = localStorage.getItem(NOTIFS_STORAGE_KEY);
    const prev = raw ? JSON.parse(raw) : [];
    const newNotif = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type,
      icon,
      title,
      message,
      time: 'Vừa xong',
      isRead: false,
      link,
      createdAt: new Date().toISOString(),
    };
    const updated = [newNotif, ...prev.slice(0, 49)]; // Giữ tối đa 50 thông báo gần nhất
    localStorage.setItem(NOTIFS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('mini_shopee_new_notification', { detail: newNotif }));
    return newNotif;
  } catch (err) {
    console.warn('Failed to push notification:', err);
    return null;
  }
}
