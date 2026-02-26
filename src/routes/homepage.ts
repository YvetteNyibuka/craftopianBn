import { Router } from "express";
import { getHomepage, updateHomepage } from "../controllers/homepageController";
import { protect, restrictTo } from "../middleware/auth";

const router = Router();

router.get("/", getHomepage);                                          // public
router.patch("/", protect, restrictTo("admin", "staff"), updateHomepage); // admin

export default router;
