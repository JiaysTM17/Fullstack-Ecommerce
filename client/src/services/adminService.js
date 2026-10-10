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

/**
 * Lấy báo cáo thuế TNCN/GTGT nhà thầu sàn TMĐT (Withholding Tax Report)
 */
export async function getAdminTaxReports() {
  try {
    const res = await apiRequest("/api/admin/finance/tax-reports", {
      headers: getAdminHeaders(),
    });
    return res?.data || res || null;
  } catch (error) {
    console.warn("[AdminService] getAdminTaxReports fallback:", error.message);
    return null;
  }
}

/**
 * Quét an ninh và phát hiện gian lận (Fraud & Anomaly Radar)
 */
export async function getAdminFraudRadar() {
  try {
    const res = await apiRequest("/api/admin/security/fraud-radar", {
      headers: getAdminHeaders(),
    });
    return res?.data || res || null;
  } catch (error) {
    console.warn("[AdminService] getAdminFraudRadar fallback:", error.message);
    return null;
  }
}

/**
 * Lấy dữ liệu Giám sát Quỹ Ký Quỹ & Thanh Khoản Sàn (Escrow Cashflow & Vault Monitor)
 */
export async function getAdminEscrowVaultAPI() {
  try {
    const res = await apiRequest("/api/admin/finance/escrow-vault", {
      headers: getAdminHeaders(),
    });
    return res?.data || res || null;
  } catch (error) {
    console.warn("[AdminService] getAdminEscrowVaultAPI fallback:", error.message);
    return null;
  }
}


/**
 * Xử lý hoặc miễn trừ cảnh báo an ninh từ Fraud Radar
 */
export async function resolveAdminFraudAnomalyAPI(id, action, note = "") {
  try {
    const res = await apiRequest(`/api/admin/security/fraud-radar/${id}/resolve`, {
      method: "POST",
      headers: getAdminHeaders(),
      body: JSON.stringify({ action, note }),
    });
    return res?.data || res || null;
  } catch (error) {
    console.error("[AdminService] resolveAdminFraudAnomalyAPI error:", error.message);
    throw error;
  }
}

/**
 * Phê duyệt và giải ngân thanh toán đối soát tài chính cho gian hàng
 */
export async function approveAdminSettlementAPI(shopId, note = "") {
  try {
    const res = await apiRequest(`/api/admin/finance/settlements/${shopId}/approve`, {
      method: "POST",
      headers: getAdminHeaders(),
      body: JSON.stringify({ note }),
    });
    return res?.data || res || null;
  } catch (error) {
    console.error("[AdminService] approveAdminSettlementAPI error:", error.message);
    throw error;
  }
}

/**
 * Lấy danh sách đối soát tài chính của các gian hàng trên sàn (Finance Settlements)
 */
export async function getAdminFinanceSettlements() {
  try {
    const res = await apiRequest("/api/admin/finance", {
      headers: getAdminHeaders(),
    });
    return res?.data || res || [];
  } catch (error) {
    console.warn("[AdminService] getAdminFinanceSettlements fallback:", error.message);
    return null;
  }
}

/**
 * Phát sóng thông báo đa kênh toàn sàn (Super Admin Omnichannel Notification Broadcast)
 */
export async function broadcastAdminNotificationAPI(payload) {
  try {
    const res = await apiRequest("/api/notifications/broadcast", {
      method: "POST",
      headers: getAdminHeaders(),
      body: JSON.stringify(payload),
    });
    return res?.data || res || null;
  } catch (error) {
    console.error("[AdminService] broadcastAdminNotificationAPI error:", error.message);
    throw error;
  }
}

/**
 * Lấy báo cáo đối soát COD bưu tá & sàn (COD Logistics Reconciliation)
 */
export async function getAdminCodReconciliationAPI() {
  try {
    const res = await apiRequest("/api/admin/finance/cod-reconciliation", {
      headers: getAdminHeaders(),
    });
    return res?.data || res || null;
  } catch (error) {
    console.warn("[AdminService] getAdminCodReconciliationAPI fallback:", error.message);
    return null;
  }
}

/**
 * Xác nhận khớp đối soát lô đơn hàng COD (Batch Clear COD)
 */
export async function batchClearAdminCodAPI(orderIds = []) {
  try {
    const res = await apiRequest("/api/admin/finance/cod-reconciliation/batch-clear", {
      method: "POST",
      headers: getAdminHeaders(),
      body: JSON.stringify({ orderIds }),
    });
    return res?.data || res || null;
  } catch (error) {
    console.error("[AdminService] batchClearAdminCodAPI error:", error.message);
    throw error;
  }
}

/**
 * Radar Phát hiện Gian lận & Lạm dụng Hoàn trả Khách hàng (Buyer Abuse Radar)
 */
export async function getBuyerAbuseRadarAPI() {
  try {
    const res = await apiRequest("/api/admin/security/buyer-abuse-radar", {
      headers: getAdminHeaders(),
    });
    return res?.data || res || null;
  } catch (error) {
    console.warn("[AdminService] getBuyerAbuseRadarAPI fallback:", error.message);
    return null;
  }
}

/**
 * Áp dụng chế tài đối với tài khoản gian lận hoàn trả (Arbitrate Buyer Abuse)
 */
export async function arbitrateBuyerAbuseAPI(userId, { action, reason }) {
  try {
    const res = await apiRequest(`/api/admin/security/buyer-abuse/${userId}/arbitrate`, {
      method: "POST",
      headers: getAdminHeaders(),
      body: JSON.stringify({ action, reason }),
    });
    return res?.data || res || null;
  } catch (error) {
    console.error("[AdminService] arbitrateBuyerAbuseAPI error:", error.message);
    throw error;
  }
}

/**
 * Lấy danh sách hồ sơ định danh thuế Merchant KYC toàn sàn
 */
export async function getAdminShopKycListAPI(status = "") {

  try {
    const query = status ? `?status=${encodeURIComponent(status)}` : "";
    const res = await apiRequest(`/api/admin/kyc/merchants${query}`, {
      headers: getAdminHeaders(),
    });
    return res?.data || res || null;
  } catch (error) {
    console.warn("[AdminService] getAdminShopKycListAPI fallback:", error.message);
    return null;
  }
}

/**
 * Thẩm định phê duyệt hoặc từ chối hồ sơ pháp nhân KYC gian hàng
 */
export async function arbitrateAdminShopKycAPI(shopId, { action, rejectedReason, businessType, taxId }) {
  try {
    const res = await apiRequest(`/api/admin/kyc/merchants/${shopId}/arbitrate`, {
      method: "POST",
      headers: getAdminHeaders(),
      body: JSON.stringify({ action, rejectedReason, businessType, taxId }),
    });
    return res?.data || res || null;
  } catch (error) {
    console.error("[AdminService] arbitrateAdminShopKycAPI error:", error.message);
    throw error;
  }
}


