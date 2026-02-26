import { Response } from "express";
import { Order } from "../models/Order";
import { Customer } from "../models/Customer";
import { AppError } from "../middleware/errorHandler";
import { asyncHandler } from "../middleware/auth";
import { AuthRequest, PaginationQuery, OrderStatus } from "../types";

/** GET /api/orders */
export const getOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page = "1", limit = "20", sort = "createdAt", order = "desc", status, search } = req.query as PaginationQuery & { status?: string };

    const query: Record<string, unknown> = {};
    if (status) query.status = status;
    if (search) {
        query.$or = [
            { orderNumber: { $regex: search, $options: "i" } },
            { customerName: { $regex: search, $options: "i" } },
            { customerEmail: { $regex: search, $options: "i" } },
        ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sortObj: Record<string, 1 | -1> = { [sort]: order === "asc" ? 1 : -1 };

    const [data, total] = await Promise.all([
        Order.find(query).sort(sortObj).skip(skip).limit(Number(limit)),
        Order.countDocuments(query),
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

/** GET /api/orders/:id */
export const getOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
    const order = await Order.findById(req.params.id);
    if (!order) throw new AppError("Order not found.", 404);
    res.json({ status: "success", data: order });
});

/** POST /api/orders */
export const createOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
    const order = await Order.create(req.body);

    // Update customer stats if customer linked
    if (order.customer) {
        await Customer.findByIdAndUpdate(order.customer, {
            $inc: { ordersCount: 1, totalSpent: order.total },
        });
    }

    res.status(201).json({ status: "success", data: order });
});

/** PATCH /api/orders/:id/status  — update only the status */
export const updateOrderStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { status } = req.body as { status: OrderStatus };
    const validStatuses: OrderStatus[] = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

    if (!validStatuses.includes(status)) {
        throw new AppError(`Invalid status. Must be one of: ${validStatuses.join(", ")}`, 400);
    }

    const order = await Order.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true, runValidators: true }
    );
    if (!order) throw new AppError("Order not found.", 404);

    res.json({ status: "success", data: order });
});

/** PATCH /api/orders/:id  — update full order */
export const updateOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
    const order = await Order.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });
    if (!order) throw new AppError("Order not found.", 404);
    res.json({ status: "success", data: order });
});

/** DELETE /api/orders/:id */
export const deleteOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) throw new AppError("Order not found.", 404);
    res.status(204).send();
});

/** GET /api/orders/stats  — dashboard summary */
export const getOrderStats = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const [total, byStatus, revenue] = await Promise.all([
        Order.countDocuments(),
        Order.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
        Order.aggregate([
            { $match: { status: "Delivered" } },
            { $group: { _id: null, total: { $sum: "$total" } } },
        ]),
    ]);

    res.json({
        status: "success",
        data: {
            total,
            byStatus: Object.fromEntries(byStatus.map(({ _id, count }) => [_id, count])),
            revenue: revenue[0]?.total ?? 0,
        },
    });
});
