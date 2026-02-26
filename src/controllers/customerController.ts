import { Response } from "express";
import { Customer } from "../models/Customer";
import { Order } from "../models/Order";
import { AppError } from "../middleware/errorHandler";
import { asyncHandler } from "../middleware/auth";
import { AuthRequest, PaginationQuery } from "../types";

/** GET /api/customers */
export const getCustomers = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page = "1", limit = "20", sort = "createdAt", order = "desc", search, status } = req.query as PaginationQuery & { status?: string };

    const query: Record<string, unknown> = {};
    if (status) query.status = status;
    if (search) query.$text = { $search: search };

    const skip = (Number(page) - 1) * Number(limit);
    const sortObj: Record<string, 1 | -1> = { [sort]: order === "asc" ? 1 : -1 };

    const [data, total] = await Promise.all([
        Customer.find(query).sort(sortObj).skip(skip).limit(Number(limit)),
        Customer.countDocuments(query),
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

/** GET /api/customers/:id */
export const getCustomer = asyncHandler(async (req: AuthRequest, res: Response) => {
    const customer = await Customer.findById(req.params.id);
    if (!customer) throw new AppError("Customer not found.", 404);

    // Fetch their orders too
    const orders = await Order.find({ customer: req.params.id })
        .sort({ createdAt: -1 })
        .limit(10)
        .select("orderNumber total status createdAt itemCount");

    res.json({ status: "success", data: { ...customer.toJSON(), recentOrders: orders } });
});

/** POST /api/customers */
export const createCustomer = asyncHandler(async (req: AuthRequest, res: Response) => {
    const customer = await Customer.create(req.body);
    res.status(201).json({ status: "success", data: customer });
});

/** PATCH /api/customers/:id */
export const updateCustomer = asyncHandler(async (req: AuthRequest, res: Response) => {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });
    if (!customer) throw new AppError("Customer not found.", 404);
    res.json({ status: "success", data: customer });
});

/** DELETE /api/customers/:id */
export const deleteCustomer = asyncHandler(async (req: AuthRequest, res: Response) => {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) throw new AppError("Customer not found.", 404);
    res.status(204).send();
});

/** GET /api/customers/stats */
export const getCustomerStats = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const [total, active, topSpenders, avgOrderValue] = await Promise.all([
        Customer.countDocuments(),
        Customer.countDocuments({ status: "Active" }),
        Customer.find().sort({ totalSpent: -1 }).limit(5).select("name email totalSpent ordersCount"),
        Customer.aggregate([
            { $match: { ordersCount: { $gt: 0 } } },
            { $group: { _id: null, avg: { $avg: { $divide: ["$totalSpent", "$ordersCount"] } } } },
        ]),
    ]);

    res.json({
        status: "success",
        data: {
            total,
            active,
            inactive: total - active,
            topSpenders,
            avgOrderValue: Math.round(avgOrderValue[0]?.avg ?? 0),
        },
    });
});
