import { Router } from "express";
import {
    getProducts, getProduct, createProduct,
    updateProduct, deleteProduct, getLowStock,
} from "../controllers/productController";
import { protect, restrictTo } from "../middleware/auth";

const router = Router();

// Public — storefront reads
router.get("/", getProducts);
router.get("/low-stock", protect, getLowStock); // admin only
router.get("/:slug", getProduct);

// Admin/staff — create & update
router.use(protect);
router.post("/", restrictTo("admin", "staff"), createProduct);
router.patch("/:id", restrictTo("admin", "staff"), updateProduct);
router.delete("/:id", restrictTo("admin"), deleteProduct);

export default router;
