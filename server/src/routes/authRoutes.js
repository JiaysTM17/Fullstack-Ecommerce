import express from "express";
import {
  register, login, me, profile, demo,
  changePassword, forgotPassword, resetPassword,
  refreshToken, logout,
  sendRegistrationOtp, verifyRegistrationOtp,
} from "../controllers/authController.js";
import { authenticate } from "../middlewares/auth.js";

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/demo", demo);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/send-registration-otp", sendRegistrationOtp);
router.post("/verify-registration-otp", verifyRegistrationOtp);

// Private routes (authenticated)
router.get("/me", authenticate, me);
router.put("/profile", authenticate, profile);
router.put("/change-password", authenticate, changePassword);
router.post("/refresh-token", authenticate, refreshToken);
router.post("/logout", authenticate, logout);

export default router;
