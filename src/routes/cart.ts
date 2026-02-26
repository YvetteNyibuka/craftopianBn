import { Router } from "express";
import {
    getCart, addToCart, updateCartItem,
    removeCartItem, clearCart,
} from "../controllers/cartController";
import { protect } from "../middleware/auth";

const router = Router();

// All cart routes require authentication
router.use(protect);

router.get("/", getCart);
router.post("/items", addToCart);
router.patch("/items/:itemId", updateCartItem);
router.delete("/items/:itemId", removeCartItem);
router.delete("/", clearCart);

export default router;
