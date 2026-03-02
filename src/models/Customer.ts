import { Schema, model, Document } from "mongoose";

export interface ICustomer extends Document {
    name: string;
    email: string;
    phone?: string;
    status: "Active" | "Inactive";
    ordersCount: number;
    totalSpent: number;
    defaultAddress?: {
        line1: string;
        line2?: string;
        city: string;
        postcode: string;
        country: string;
    };
    notes?: string;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        phone: { type: String, trim: true },
        status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
        ordersCount: { type: Number, default: 0 },
        totalSpent: { type: Number, default: 0 },
        defaultAddress: {
            line1: { type: String },
            line2: { type: String },
            city: { type: String },
            postcode: { type: String },
            country: { type: String },
        },
        notes: { type: String },
        tags: [{ type: String, trim: true }],
    },
    { timestamps: true }
);

// Note: email already has unique index from schema definition
customerSchema.index({ status: 1 });
customerSchema.index({ totalSpent: -1 });
customerSchema.index({ name: "text", email: "text" }); // full-text search

export const Customer = model<ICustomer>("Customer", customerSchema);
