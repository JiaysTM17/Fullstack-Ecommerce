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

/**
 * Lấy danh sách Nhật ký kiểm toán toàn sàn (Audit Logs)
 */
export async function getAdminAuditLogs(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await apiRequest(`/api/admin/audit-logs${query ? `?${query}` : ""}`, {
      headers: getAdminHeaders(),
    });
    return res?.data?.logs || res?.logs || [];
  } catch (error) {
    console.warn("[AdminService] getAdminAuditLogs fallback:", error.message);
    return [];
  }
}

/**
 * Lấy danh sách Siêu chiến dịch Mega Campaigns
 */
export async function getAdminCampaigns() {
  try {
    const res = await apiRequest("/api/admin/campaigns", {
      headers: getAdminHeaders(),
    });
    return res?.data?.campaigns || res?.campaigns || [];
  } catch (error) {
    console.warn("[AdminService] getAdminCampaigns fallback:", error.message);
    return [];
  }
}

/**
 * Tạo mới Siêu chiến dịch Mega Campaign
 */
export async function createAdminCampaign(data) {
  return await apiRequest("/api/admin/campaigns", {
    method: "POST",
    headers: getAdminHeaders(),
    body: JSON.stringify(data),
  });
}

/**
 * Cập nhật trạng thái chiến dịch
 */
export async function updateAdminCampaignStatus(id, status) {
  return await apiRequest(`/api/admin/campaigns/${id}/status`, {
    method: "PUT",
    headers: getAdminHeaders(),
    body: JSON.stringify({ status }),
  });
}

/**
 * Lấy danh sách Tranh chấp khiếu nại (Dispute Center)
 */
export async function getAdminDisputes() {
  try {
    const res = await apiRequest("/api/admin/disputes", {
      headers: getAdminHeaders(),
    });
    return res?.data?.disputes || res?.disputes || [];
  } catch (error) {
    console.warn("[AdminService] getAdminDisputes fallback:", error.message);
    return [];
  }
}

/**
 * Phán quyết trọng tài khiếu nại (Arbitration)
 */
export async function arbitrateAdminDispute(id, resolution, note = "") {
  return await apiRequest(`/api/admin/disputes/${id}/arbitrate`, {
    method: "POST",
    headers: getAdminHeaders(),
    body: JSON.stringify({ resolution, note }),
  });
}

/**
 * Lấy dữ liệu phân tích BI chuyên sâu (Cohorts, SLA, Thị phần)
 */
export async function getAdminPlatformDeepBI() {
  try {
    const res = await apiRequest("/api/admin/analytics/deep-bi", {
      headers: getAdminHeaders(),
    });
    return res?.data || res || null;
  } catch (error) {
    console.warn("[AdminService] getAdminPlatformDeepBI fallback:", error.message);
    return null;
  }
}
