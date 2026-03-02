import { Response } from "express";
import { Collection } from "../models/Collection";
import { AppError } from "../middleware/errorHandler";
import { asyncHandler } from "../middleware/auth";
import { AuthRequest, PaginationQuery } from "../types";

/** GET /api/collections  — list with pagination, filtering, search */
export const getCollections = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const {
      page = "1",
      limit = "20",
      sort = "createdAt",
      order = "desc",
      search,
      status,
    } = req.query as PaginationQuery & { status?: string };

    const query: Record<string, unknown> = {};
    if (status) query.status = status;
    if (search) query.$text = { $search: search };

    const skip = (Number(page) - 1) * Number(limit);
    const sortObj: Record<string, 1 | -1> = {
      [sort]: order === "asc" ? 1 : -1,
    };

    const [data, total] = await Promise.all([
      Collection.find(query).sort(sortObj).skip(skip).limit(Number(limit)),
      Collection.countDocuments(query),
    ]);

    res.json({
      status: "success",
      data,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      limit: Number(limit),
    });
  },
);

/** GET /api/collections/:slug  — single collection by slug */
export const getCollection = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const col = await Collection.findOne({ slug: req.params.slug });
    if (!col) throw new AppError("Collection not found.", 404);
    res.json({ status: "success", data: col });
  },
);

/** POST /api/collections */
export const createCollection = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const col = await Collection.create(req.body);
    res.status(201).json({ status: "success", data: col });
  },
);

/** PUT /api/collections/:id */
export const updateCollection = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const col = await Collection.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!col) throw new AppError("Collection not found.", 404);
    res.json({ status: "success", data: col });
  },
);

/** DELETE /api/collections/:id */
export const deleteCollection = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const col = await Collection.findByIdAndDelete(req.params.id);
    if (!col) throw new AppError("Collection not found.", 404);
    res.status(204).send();
  },
);
