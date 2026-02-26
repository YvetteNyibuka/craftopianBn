import { Response } from "express";
import { Product } from "../models/Product";
import { AppError } from "../middleware/errorHandler";
import { asyncHandler } from "../middleware/auth";
import { AuthRequest, PaginationQuery } from "../types";

/** GET /api/products */
export const getProducts = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
        page = "1", limit = "20", sort = "createdAt", order = "desc",
        search, category, collection, status,
    } = req.query as PaginationQuery & { category?: string; collection?: string; status?: string };

    const query: Record<string, unknown> = {};
    if (category) query.category = category;
    if (collection) query.collection = collection;
    if (status === "active") query.isActive = true;
    if (status === "inactive") query.isActive = false;
    if (search) query.$text = { $search: search };

    const skip = (Number(page) - 1) * Number(limit);
    const sortObj: Record<string, 1 | -1> = { [sort]: order === "asc" ? 1 : -1 };

    const [data, total] = await Promise.all([
        Product.find(query)
            .populate("collectionId", "name slug")
            .sort(sortObj)
            .skip(skip)
            .limit(Number(limit)),
        Product.countDocuments(query),
    ]);

    res.json({
        status: "success",
        data,
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
    });
});

/** GET /api/products/:slug */
export const getProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
    const product = await Product.findOne({ slug: req.params.slug }).populate("collectionId", "name slug");
    if (!product) throw new AppError("Product not found.", 404);
    res.json({ status: "success", data: product });
});

/** POST /api/products */
export const createProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
    const product = await Product.create(req.body);
    res.status(201).json({ status: "success", data: product });
});

/** PATCH /api/products/:id */
export const updateProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    }).populate("collectionId", "name slug");
    if (!product) throw new AppError("Product not found.", 404);
    res.json({ status: "success", data: product });
});

/** DELETE /api/products/:id */
export const deleteProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) throw new AppError("Product not found.", 404);
    res.status(204).send();
});

/** GET /api/products/low-stock  — stock < threshold */
export const getLowStock = asyncHandler(async (req: AuthRequest, res: Response) => {
    const threshold = Number(req.query.threshold ?? 10);
    const products = await Product.find({
        trackInventory: true,
        stockCount: { $gt: 0, $lt: threshold },
        isActive: true,
    }).select("title sku stockCount images category");

    res.json({ status: "success", data: products, total: products.length });
});
