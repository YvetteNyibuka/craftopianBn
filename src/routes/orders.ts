import { Router } from "express";
import {
    getOrders, getOrder, createOrder,
    updateOrder, updateOrderStatus, deleteOrder, getOrderStats,
} from "../controllers/orderController";
import { protect, restrictTo } from "../middleware/auth";

const router = Router();

router.use(protect); // All order routes require auth

router.get("/stats", getOrderStats);
router.get("/", getOrders);
router.get("/:id", getOrder);
router.post("/", createOrder);
router.patch("/:id/status", restrictTo("admin", "staff"), updateOrderStatus);
router.patch("/:id", restrictTo("admin", "staff"), updateOrder);
router.delete("/:id", restrictTo("admin"), deleteOrder);

export default router;
