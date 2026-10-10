import express from "express";
import { authenticate, authorize, requireShopAccess } from "../middlewares/auth.js";
import {
  getMySellerShop,
  updateMySellerShop,
  onboardShop,
  getSellerStats,
  getSellerProducts,
  createSellerProduct,
  updateSellerProduct,
  deleteSellerProduct,
  getSellerOrders,
  updateSellerOrderStatus,
  getSellerDashboard,
  getSellerRevenue,
  getSellerPendingOrders,
  confirmSellerOrder,
  batchConfirmSellerOrders,
  getSellerWallet,
  getSellerAnalyticsFunnel,
  getSellerMarketIntelligence,
  getSellerStaffList,
  addSellerStaff,
  updateSellerStaff,
  getSellerAdsCampaigns,
  createSellerAdsCampaign,
  toggleSellerAdsCampaign,
  simulateSellerAds,
  batchUpdateSellerInventory,
  getSellerFlashSales,
  createSellerFlashSale,
  updateSellerFlashSaleStatus,
  deleteSellerFlashSale,
  requestSellerWithdrawal,
  getSellerReturnRequests,
  respondSellerReturnRequest,
  getSellerProfitAndLoss,
  getSellerShippingPolicy,
  updateSellerShippingPolicy,
  getSellerOperationalSLA,
  getSellerAutoReply,
  updateSellerAutoReply,
  simulateSellerAutoReply,
} from "../controllers/sellerController.js";

const router = express.Router();

// Onboard shop: available to any authenticated user
router.post("/shop/onboard", authenticate, onboardShop);

// All subsequent routes require seller (or admin) role and shop access guard
router.use(authenticate, authorize("seller", "admin"), requireShopAccess());

// Seller Dashboard & Analytics
router.get("/dashboard", getSellerDashboard);
router.get("/revenue", getSellerRevenue);
router.get("/analytics/funnel", getSellerAnalyticsFunnel);
router.get("/analytics/market", getSellerMarketIntelligence);
router.get("/analytics/profit-loss", getSellerProfitAndLoss);

// Shopee Ads ROI Suite
router.get("/ads", getSellerAdsCampaigns);
router.post("/ads", createSellerAdsCampaign);
router.post("/ads/simulate", simulateSellerAds);
router.patch("/ads/:id/toggle", toggleSellerAdsCampaign);

// Advanced Inventory Management
router.post("/inventory/batch-update", batchUpdateSellerInventory);

// Flash Sale Shop Management
router.get("/flash-sales", getSellerFlashSales);
router.post("/flash-sales", createSellerFlashSale);
router.patch("/flash-sales/:id/status", updateSellerFlashSaleStatus);
router.delete("/flash-sales/:id", deleteSellerFlashSale);

// Staff Sub-accounts Management
router.get("/staff", getSellerStaffList);
router.post("/staff", addSellerStaff);
router.put("/staff/:id", updateSellerStaff);

router.route("/shop")
  .get(getMySellerShop)
  .put(updateMySellerShop);

router.route("/shipping-policy")
  .get(getSellerShippingPolicy)
  .put(updateSellerShippingPolicy);

router.route("/auto-reply")
  .get(getSellerAutoReply)
  .put(updateSellerAutoReply);

router.post("/auto-reply/simulate", simulateSellerAutoReply);

router.get("/operational-sla", getSellerOperationalSLA);

router.get("/stats", getSellerStats);
router.get("/wallet", getSellerWallet);
router.post("/wallet/withdraw", requestSellerWithdrawal);

router.route("/products")
  .get(getSellerProducts)
  .post(createSellerProduct);

router.route("/products/:id")
  .put(updateSellerProduct)
  .delete(deleteSellerProduct);

router.get("/orders", getSellerOrders);
router.get("/orders/pending", getSellerPendingOrders);
router.get("/orders/returns", getSellerReturnRequests);
router.patch("/orders/:id/status", updateSellerOrderStatus);
router.patch("/orders/:id/confirm", confirmSellerOrder);
router.post("/orders/batch-confirm", batchConfirmSellerOrders);
router.post("/orders/:id/return-response", respondSellerReturnRequest);

export default router;
