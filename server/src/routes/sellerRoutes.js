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
  getSellerWallet,
  getSellerAnalyticsFunnel,
  getSellerMarketIntelligence,
  getSellerStaffList,
  addSellerStaff,
  updateSellerStaff,
  getSellerAdsCampaigns,
  createSellerAdsCampaign,
  toggleSellerAdsCampaign,
  batchUpdateSellerInventory,
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

// Shopee Ads ROI Suite
router.get("/ads", getSellerAdsCampaigns);
router.post("/ads", createSellerAdsCampaign);
router.patch("/ads/:id/toggle", toggleSellerAdsCampaign);

// Advanced Inventory Management
router.post("/inventory/batch-update", batchUpdateSellerInventory);

// Staff Sub-accounts Management
router.get("/staff", getSellerStaffList);
router.post("/staff", addSellerStaff);
router.put("/staff/:id", updateSellerStaff);

router.route("/shop")
  .get(getMySellerShop)
  .put(updateMySellerShop);

router.get("/stats", getSellerStats);
router.get("/wallet", getSellerWallet);

router.route("/products")
  .get(getSellerProducts)
  .post(createSellerProduct);

router.route("/products/:id")
  .put(updateSellerProduct)
  .delete(deleteSellerProduct);

router.get("/orders", getSellerOrders);
router.get("/orders/pending", getSellerPendingOrders);
router.patch("/orders/:id/status", updateSellerOrderStatus);
router.patch("/orders/:id/confirm", confirmSellerOrder);

export default router;
