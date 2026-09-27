import express from "express";
import { register, login, me, profile, demo } from "../controllers/authController.js";
import { authenticate } from "../middlewares/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticate, me);
router.put("/profile", authenticate, profile);
router.post("/demo", demo);

export default router;
