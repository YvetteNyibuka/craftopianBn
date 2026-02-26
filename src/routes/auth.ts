import { Router } from "express";
import {
    signup, login, adminRegister, getMe, updateMe,
    changePassword, logout, forgotPassword, resetPassword, deleteMe,
} from "../controllers/authController";
import { protect, restrictTo } from "../middleware/auth";
import { authLimiter, sensitiveLimiter } from "../middleware/rateLimiter";

const router = Router();

// ── Public routes (rate-limited) ──────────────────────────────────────────────
router.post("/signup", authLimiter, signup);
router.post("/login", authLimiter, login);
router.post("/forgot-password", sensitiveLimiter, forgotPassword);
router.post("/reset-password", sensitiveLimiter, resetPassword);
router.post("/logout", logout);

// ── Protected — any authenticated user ───────────────────────────────────────
router.use(protect);
router.get("/me", getMe);
router.patch("/update-me", updateMe);
router.patch("/change-password", sensitiveLimiter, changePassword);
router.delete("/delete-me", deleteMe);

// ── Admin only ────────────────────────────────────────────────────────────────
router.post("/admin-register", restrictTo("admin"), adminRegister);

export default router;
