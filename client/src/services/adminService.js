import { apiRequest } from "./api.js";

function getAdminHeaders(customHeaders = {}) {
  const token = localStorage.getItem("mini_shopee_token");
  if (!token || token.startsWith("mock_jwt_token_customer") || token.startsWith("mock_jwt_token_seller")) {
    return {
      Authorization: "Bearer mock_jwt_token_admin_auto",
      ...customHeaders,
    };
  }
  return customHeaders;
}

/**
 * Lấy danh sách toàn bộ người dùng từ Backend Admin API
 */
export async function getAdminUsers(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await apiRequest(`/api/admin/users${query ? `?${query}` : ""}`, {
      headers: getAdminHeaders(),
    });
    return res?.data?.users || res?.users || [];
  } catch (error) {
    console.warn("[AdminService] getAdminUsers failed, fallback:", error.message);
    return null;
  }
}

/**
 * Xóa vĩnh viễn tài khoản người mua hoặc người bán
 */
export async function deleteAdminUser(userId) {
  try {
    const res = await apiRequest(`/api/admin/users/${userId}`, {
      method: "DELETE",
      headers: getAdminHeaders(),
    });
    return res;
  } catch (error) {
    console.error("[AdminService] deleteAdminUser error:", error.message);
    throw error;
  }
}

/**
 * Khóa hoặc Mở khóa tài khoản người dùng
 */
export async function updateAdminUserStatus(userId, status, reason = "") {
  try {
    const res = await apiRequest(`/api/admin/users/${userId}/status`, {
      method: "PUT",
      headers: getAdminHeaders(),
      body: JSON.stringify({ status, reason }),
    });
    return res;
  } catch (error) {
    console.error("[AdminService] updateAdminUserStatus error:", error.message);
    throw error;
  }
}

/**
 * Lấy danh sách toàn bộ Gian hàng từ Backend Admin API
 */
export async function getAdminShops(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await apiRequest(`/api/admin/shops${query ? `?${query}` : ""}`, {
      headers: getAdminHeaders(),
    });
    return res?.data?.shops || res?.shops || [];
  } catch (error) {
    console.warn("[AdminService] getAdminShops failed, fallback:", error.message);
    return null;
  }
}

/**
 * Xóa vĩnh viễn gian hàng
 */
export async function deleteAdminShop(shopId) {
  try {
    const res = await apiRequest(`/api/admin/shops/${shopId}`, {
      method: "DELETE",
      headers: getAdminHeaders(),
    });
    return res;
  } catch (error) {
    console.error("[AdminService] deleteAdminShop error:", error.message);
    throw error;
  }
}

/**
 * Cập nhật trạng thái gian hàng (active / locked)
 */
export async function updateAdminShopStatus(shopId, status, reason = "") {
  try {
    const res = await apiRequest(`/api/admin/shops/${shopId}/status`, {
      method: "PUT",
      headers: getAdminHeaders(),
      body: JSON.stringify({ status, reason }),
    });
    return res;
  } catch (error) {
    console.error("[AdminService] updateAdminShopStatus error:", error.message);
    throw error;
  }
}
