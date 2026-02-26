/* eslint-disable @typescript-eslint/no-explicit-any */
import { Schema, model, Document, Types } from "mongoose";
import { OrderStatus } from "../types";

export interface IOrderItem {
    product: Types.ObjectId;
    title: string;
    image?: string;
    price: number;
    quantity: number;
    variant?: string;
}

export interface IShippingAddress {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    postcode: string;
    country: string;
    phone?: string;
}

export interface IOrder extends Document {
    orderNumber: string;
    customer: Types.ObjectId;
    customerName: string;
    customerEmail: string;
    items: IOrderItem[];
    shippingAddress: IShippingAddress;
    subtotal: number;
    shippingCost: number;
    discount: number;
    total: number;
    status: OrderStatus;
    paymentStatus: "Pending" | "Paid" | "Refunded" | "Failed";
    paymentMethod?: string;
    notes?: string;
    trackingNumber?: string;
    createdAt: Date;
    updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>({
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    title: { type: String, required: true },
    image: { type: String },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    variant: { type: String },
});

const shippingAddressSchema = new Schema<IShippingAddress>({
    name: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String },
    city: { type: String, required: true },
    postcode: { type: String, required: true },
    country: { type: String, required: true },
    phone: { type: String },
});

const orderSchema = new Schema<IOrder>(
    {
        orderNumber: { type: String, unique: true },
        customer: { type: Schema.Types.ObjectId, ref: "Customer" },
        customerName: { type: String, required: true },
        customerEmail: { type: String, required: true, lowercase: true },
        items: {
            type: [orderItemSchema],
            required: true,
            validate: [(v: IOrderItem[]) => v.length > 0, "Order must have at least one item"],
        },
        shippingAddress: { type: shippingAddressSchema, required: true },
        subtotal: { type: Number, required: true, min: 0 },
        shippingCost: { type: Number, default: 0, min: 0 },
        discount: { type: Number, default: 0, min: 0 },
        total: { type: Number, required: true, min: 0 },
        status: {
            type: String,
            enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
            default: "Pending",
        },
        paymentStatus: {
            type: String,
            enum: ["Pending", "Paid", "Refunded", "Failed"],
            default: "Pending",
        },
        paymentMethod: { type: String },
        notes: { type: String },
        trackingNumber: { type: String },
    },
    { timestamps: true }
);

// Auto-generate order number before saving
(orderSchema as any).pre("save", async function (this: IOrder, next: () => void) {
    if (!this.orderNumber) {
        const count = await model("Order").countDocuments();
        this.orderNumber = `#ORD-${String(count + 1).padStart(4, "0")}`;
    }
    next();
});

orderSchema.index({ orderNumber: 1 });
orderSchema.index({ customer: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

export const Order = model<IOrder>("Order", orderSchema);
