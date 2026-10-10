import express from "express";
import { authenticate, authorize } from "../middlewares/auth.js";
import {
  getAllShopsAdmin,
  updateShopStatusAdmin,
  updateShopCommissionAdmin,
  deleteShopAdmin,
  getAllUsersAdmin,
  updateUserStatusAdmin,
  deleteUserAdmin,
  getPlatformOverviewAdmin,
  getFinanceSettlementsAdmin,
  getDashboard,
  getRevenueChart,
  getTopProducts,
  getTopShops,
  getRecentOrders,
  getAdminAuditLogs,
  exportAdminAuditLogs,
  getAdminCampaigns,
  createAdminCampaign,
  updateAdminCampaignStatus,
  getAdminDisputes,
  arbitrateAdminDispute,
  getAdminPlatformDeepBI,
  getAdminTaxReports,
  getAdminFraudRadar,
  resolveAdminFraudAnomaly,
  approveSettlementPayoutAdmin,
  getAdminEscrowVault,
  getAdminCodReconciliation,
  batchClearAdminCodReconciliation,
  getBuyerAbuseRadar,
  arbitrateBuyerAbuse,
  getAdminShopKycList,
  arbitrateAdminShopKyc,
} from "../controllers/adminController.js";


const router = express.Router();

// All routes require Super Admin privileges
router.use(authenticate, authorize("admin"));

// Dashboard Analytics & Deep BI
router.get("/dashboard", getDashboard);
router.get("/revenue-chart", getRevenueChart);
router.get("/top-products", getTopProducts);
router.get("/top-shops", getTopShops);
router.get("/recent-orders", getRecentOrders);
router.get("/analytics/deep-bi", getAdminPlatformDeepBI);

// Audit Logs & Export
router.get("/audit-logs/export", exportAdminAuditLogs);
router.get("/audit-logs", getAdminAuditLogs);

// Mega Campaigns Management
router.get("/campaigns", getAdminCampaigns);
router.post("/campaigns", createAdminCampaign);
router.put("/campaigns/:id/status", updateAdminCampaignStatus);

// Disputes & Arbitration Center
router.get("/disputes", getAdminDisputes);
router.post("/disputes/:id/arbitrate", arbitrateAdminDispute);

// Shops moderation
router.get("/shops", getAllShopsAdmin);
router.put("/shops/:id/status", updateShopStatusAdmin);
router.put("/shops/:id/commission", updateShopCommissionAdmin);
router.delete("/shops/:id", deleteShopAdmin);

// Users moderation
router.get("/users", getAllUsersAdmin);
router.put("/users/:id/status", updateUserStatusAdmin);
router.delete("/users/:id", deleteUserAdmin);

// Platform Overview & Finance
router.get("/overview", getPlatformOverviewAdmin);
router.get("/finance", getFinanceSettlementsAdmin);
router.post("/finance/settlements/:shopId/approve", approveSettlementPayoutAdmin);
router.get("/finance/tax-reports", getAdminTaxReports);
router.get("/finance/escrow-vault", getAdminEscrowVault);
router.get("/finance/cod-reconciliation", getAdminCodReconciliation);
router.post("/finance/cod-reconciliation/batch-clear", batchClearAdminCodReconciliation);

// Fraud & Security Radar
router.get("/security/fraud-radar", getAdminFraudRadar);
router.post("/security/fraud-radar/:id/resolve", resolveAdminFraudAnomaly);
router.get("/security/buyer-abuse-radar", getBuyerAbuseRadar);
router.post("/security/buyer-abuse/:userId/arbitrate", arbitrateBuyerAbuse);

// Merchant Legal KYC & Tax Center
router.get("/kyc/merchants", getAdminShopKycList);
router.post("/kyc/merchants/:shopId/arbitrate", arbitrateAdminShopKyc);

export default router;
