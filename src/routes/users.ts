import { Router } from "express";
import {
    getAddresses, addAddress, updateAddress,
    deleteAddress, setDefaultAddress,
} from "../controllers/addressController";
import { getWishlist, addToWishlist, removeFromWishlist, clearWishlist } from "../controllers/wishlistController";
import { protect } from "../middleware/auth";

const router = Router();

// All user routes require authentication
router.use(protect);

// ── Addresses ─────────────────────────────────────────────────────────────────
router.get("/me/addresses", getAddresses);
router.post("/me/addresses", addAddress);
router.patch("/me/addresses/:addressId", updateAddress);
router.patch("/me/addresses/:addressId/default", setDefaultAddress);
router.delete("/me/addresses/:addressId", deleteAddress);

// ── Wishlist ──────────────────────────────────────────────────────────────────
router.get("/me/wishlist", getWishlist);
router.post("/me/wishlist/:productId", addToWishlist);
router.delete("/me/wishlist", clearWishlist);
router.delete("/me/wishlist/:productId", removeFromWishlist);

export default router;
