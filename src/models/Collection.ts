import { Schema, model, Document } from "mongoose";

export interface ICollection extends Document {
    name: string;
    slug: string;
    description?: string;
    coverImage?: string;
    status: "active" | "inactive";
    sortOrder: "manual" | "best-selling" | "price-asc" | "price-desc" | "newest" | "alpha-asc";
    isFeatured: boolean;
    showOnHomepage: boolean;
    tags: string[];
    seoTitle?: string;
    seoDescription?: string;
    productCount: number;
    revenue: number;
    createdAt: Date;
    updatedAt: Date;
}

const collectionSchema = new Schema<ICollection>(
    {
        name: { type: String, required: true, trim: true },
        slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
        description: { type: String, trim: true },
        coverImage: { type: String },
        status: { type: String, enum: ["active", "inactive"], default: "active" },
        sortOrder: {
            type: String,
            enum: ["manual", "best-selling", "price-asc", "price-desc", "newest", "alpha-asc"],
            default: "manual",
        },
        isFeatured: { type: Boolean, default: false },
        showOnHomepage: { type: Boolean, default: false },
        tags: [{ type: String, trim: true }],
        seoTitle: { type: String, trim: true },
        seoDescription: { type: String, trim: true },
        productCount: { type: Number, default: 0 },
        revenue: { type: Number, default: 0 },
    },
    { timestamps: true }
);

// Indexes for common query patterns
// Note: slug already has unique index from schema definition
collectionSchema.index({ status: 1 });
collectionSchema.index({ isFeatured: 1 });
collectionSchema.index({ showOnHomepage: 1 });

export const Collection = model<ICollection>("Collection", collectionSchema);
