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
} from "../controllers/sellerController.js";

const router = express.Router();

// Onboard shop: available to any authenticated user
router.post("/shop/onboard", authenticate, onboardShop);

// All subsequent routes require seller (or admin) role and shop access guard
router.use(authenticate, authorize("seller", "admin"), requireShopAccess());

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
router.patch("/orders/:id/status", updateSellerOrderStatus);

export default router;
