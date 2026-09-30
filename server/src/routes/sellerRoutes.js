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
} from "../controllers/sellerController.js";

const router = express.Router();

// Onboard shop: available to any authenticated user
router.post("/shop/onboard", authenticate, onboardShop);

// All subsequent routes require seller (or admin) role and shop access guard
router.use(authenticate, authorize("seller", "admin"), requireShopAccess());

// Seller Dashboard & Analytics
router.get("/dashboard", getSellerDashboard);
router.get("/revenue", getSellerRevenue);

router.route("/shop")
  .get(getMySellerShop)
  .put(updateMySellerShop);

router.get("/stats", getSellerStats);

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
