import express from "express";
import { authenticate, authorize } from "../middlewares/auth.js";
import {
  getAllShopsAdmin,
  updateShopStatusAdmin,
  updateShopCommissionAdmin,
  getAllUsersAdmin,
  updateUserStatusAdmin,
  getPlatformOverviewAdmin,
  getFinanceSettlementsAdmin,
  getDashboard,
  getRevenueChart,
  getTopProducts,
  getTopShops,
  getRecentOrders,
} from "../controllers/adminController.js";

const router = express.Router();

// All routes require Super Admin privileges
router.use(authenticate, authorize("admin"));

// Dashboard Analytics
router.get("/dashboard", getDashboard);
router.get("/revenue-chart", getRevenueChart);
router.get("/top-products", getTopProducts);
router.get("/top-shops", getTopShops);
router.get("/recent-orders", getRecentOrders);

// Shops moderation
router.get("/shops", getAllShopsAdmin);
router.put("/shops/:id/status", updateShopStatusAdmin);
router.put("/shops/:id/commission", updateShopCommissionAdmin);

// Users moderation
router.get("/users", getAllUsersAdmin);
router.put("/users/:id/status", updateUserStatusAdmin);

// Platform Overview & Finance
router.get("/overview", getPlatformOverviewAdmin);
router.get("/finance", getFinanceSettlementsAdmin);

export default router;
