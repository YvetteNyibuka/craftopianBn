import { Response } from "express";
import { Cart } from "../models/Cart";
import { Product } from "../models/Product";
import { AppError } from "../middleware/errorHandler";
import { asyncHandler } from "../middleware/auth";
import { AuthRequest } from "../types";

// ── GET /api/cart ─────────────────────────────────────────────────────────────

export const getCart = asyncHandler(async (req: AuthRequest, res: Response) => {
    let cart = await Cart.findOne({ user: req.user!.id })
        .populate("items.product", "title slug images price comparePrice isActive stockCount");

    if (!cart) {
        cart = await Cart.create({ user: req.user!.id, items: [] });
    }

    res.json({ status: "success", data: cart });
});

// ── POST /api/cart/items ──────────────────────────────────────────────────────

export const addToCart = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { productId, quantity = 1, variant } = req.body;

    if (!productId) throw new AppError("productId is required.", 400);

    // Validate product exists and is in stock
    const product = await Product.findById(productId);
    if (!product) throw new AppError("Product not found.", 404);
    if (!product.isActive) throw new AppError("This product is no longer available.", 400);

    if (product.trackInventory && !product.continueWhenOOS && product.stockCount < quantity) {
        throw new AppError(
            `Only ${product.stockCount} unit(s) available in stock.`,
            400
        );
    }

    let cart = await Cart.findOne({ user: req.user!.id });
    if (!cart) cart = await Cart.create({ user: req.user!.id, items: [] });

    // Check if the same product+variant already in cart
    const existingItem = cart.items.find(
        (item) => item.product.toString() === productId && item.variant === (variant ?? "")
    );

    if (existingItem) {
        const newQty = existingItem.quantity + quantity;
        if (product.trackInventory && !product.continueWhenOOS && newQty > product.stockCount) {
            throw new AppError(`Only ${product.stockCount} unit(s) available.`, 400);
        }
        existingItem.quantity = Math.min(newQty, 99);
    } else {
        cart.items.push({
            product: product._id,
            title: product.title,
            image: product.images?.[0],
            price: product.price,
            quantity: Math.min(quantity, 99),
            variant,
        });
    }

    await cart.save();
    await cart.populate("items.product", "title slug images price stockCount");
    res.json({ status: "success", data: cart });
});

// ── PATCH /api/cart/items/:itemId ─────────────────────────────────────────────

export const updateCartItem = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { quantity } = req.body;
    if (!quantity || quantity < 1) throw new AppError("Quantity must be at least 1.", 400);

    const cart = await Cart.findOne({ user: req.user!.id });
    if (!cart) throw new AppError("Cart not found.", 404);

    const item = (cart.items as any).id(req.params.itemId);
    if (!item) throw new AppError("Item not found in cart.", 404);

    // Validate stock
    const product = await Product.findById(item.product);
    if (product?.trackInventory && !product.continueWhenOOS && quantity > product.stockCount) {
        throw new AppError(`Only ${product.stockCount} unit(s) available.`, 400);
    }

    item.quantity = Math.min(quantity, 99);
    await cart.save();

    res.json({ status: "success", data: cart });
});

// ── DELETE /api/cart/items/:itemId ────────────────────────────────────────────

export const removeCartItem = asyncHandler(async (req: AuthRequest, res: Response) => {
    const cart = await Cart.findOne({ user: req.user!.id });
    if (!cart) throw new AppError("Cart not found.", 404);

    const item = (cart.items as any).id(req.params.itemId);
    if (!item) throw new AppError("Item not found in cart.", 404);

    item.deleteOne();
    await cart.save();

    res.json({ status: "success", data: cart });
});

// ── DELETE /api/cart ──────────────────────────────────────────────────────────

export const clearCart = asyncHandler(async (req: AuthRequest, res: Response) => {
    await Cart.findOneAndUpdate(
        { user: req.user!.id },
        { $set: { items: [], couponCode: undefined, discount: 0 } }
    );
    res.json({ status: "success", message: "Cart cleared.", data: { items: [], subtotal: 0, total: 0, itemCount: 0 } });
});
