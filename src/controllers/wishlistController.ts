import { Response } from "express";
import { User } from "../models/User";
import { Product } from "../models/Product";
import { AppError } from "../middleware/errorHandler";
import { asyncHandler } from "../middleware/auth";
import { AuthRequest } from "../types";

// ── GET /api/users/me/wishlist ────────────────────────────────────────────────

export const getWishlist = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await User.findById(req.user!.id)
        .populate("wishlist", "title slug images price comparePrice isActive isBestSeller isNewProduct category rating reviewsCount");

    if (!user) throw new AppError("User not found.", 404);
    res.json({ status: "success", data: user.wishlist, total: user.wishlist.length });
});

// ── POST /api/users/me/wishlist/:productId ────────────────────────────────────

export const addToWishlist = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) throw new AppError("Product not found.", 404);

    const user = await User.findById(req.user!.id);
    if (!user) throw new AppError("User not found.", 404);

    const alreadyAdded = user.wishlist.some((id) => id.toString() === productId);
    if (alreadyAdded) {
        res.json({ status: "success", message: "Product is already in your wishlist.", data: user.wishlist });
        return;
    }

    user.wishlist.push(product._id);
    await user.save();

    res.status(201).json({ status: "success", message: "Added to wishlist.", data: user.wishlist });
});

// ── DELETE /api/users/me/wishlist/:productId ──────────────────────────────────

export const removeFromWishlist = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { productId } = req.params;

    const user = await User.findByIdAndUpdate(
        req.user!.id,
        { $pull: { wishlist: productId } },
        { new: true }
    ).populate("wishlist", "title slug images price");

    if (!user) throw new AppError("User not found.", 404);

    res.json({ status: "success", message: "Removed from wishlist.", data: user.wishlist });
});

// ── DELETE /api/users/me/wishlist ─────────────────────────────────────────────

export const clearWishlist = asyncHandler(async (req: AuthRequest, res: Response) => {
    await User.findByIdAndUpdate(req.user!.id, { $set: { wishlist: [] } });
    res.json({ status: "success", message: "Wishlist cleared.", data: [] });
});
