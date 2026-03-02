import { Schema, model, Document, Types } from "mongoose";

export interface IProductVariant {
    name: string;
    price: number;
    stock: number;
    sku?: string;
}

export interface IProduct extends Document {
    title: string;
    slug: string;
    description?: string;
    images: string[];
    category: string;
    collectionId?: Types.ObjectId | null;

    price: number;
    comparePrice?: number;
    sku?: string;
    barcode?: string;
    stockCount: number;
    weight?: number;
    hasVariants: boolean;
    variants: IProductVariant[];
    trackInventory: boolean;
    continueWhenOOS: boolean;
    isActive: boolean;
    isNewProduct: boolean;
    isBestSeller: boolean;
    tags: string[];
    seoTitle?: string;
    seoDescription?: string;
    rating: number;
    reviewsCount: number;
    createdAt: Date;
    updatedAt: Date;
}

const variantSchema = new Schema<IProductVariant>(
    {
        name: { type: String, required: true },
        price: { type: Number, required: true, min: 0 },
        stock: { type: Number, default: 0, min: 0 },
        sku: { type: String },
    },
    { _id: true }
);

const productSchema = new Schema<IProduct>(
    {
        title: { type: String, required: true, trim: true },
        slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
        description: { type: String, trim: true },
        images: [{ type: String }],
        category: { type: String, required: true, trim: true },
        collectionId: { type: Schema.Types.ObjectId, ref: "Collection", default: null },
        price: { type: Number, required: true, min: 0 },
        comparePrice: { type: Number, min: 0 },
        sku: { type: String, trim: true },
        barcode: { type: String, trim: true },
        stockCount: { type: Number, default: 0, min: 0 },
        weight: { type: Number, min: 0 },
        hasVariants: { type: Boolean, default: false },
        variants: [variantSchema],
        trackInventory: { type: Boolean, default: true },
        continueWhenOOS: { type: Boolean, default: false },
        isActive: { type: Boolean, default: true },
        isNewProduct: { type: Boolean, default: false },
        isBestSeller: { type: Boolean, default: false },
        tags: [{ type: String, trim: true }],
        seoTitle: { type: String, trim: true },
        seoDescription: { type: String, trim: true },
        rating: { type: Number, default: 0, min: 0, max: 5 },
        reviewsCount: { type: Number, default: 0 },
    },
    { timestamps: true }
);

// Note: slug already has unique index from schema definition
productSchema.index({ category: 1 });
productSchema.index({ collection: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ isBestSeller: 1 });
productSchema.index({ price: 1 });
productSchema.index({ title: "text", description: "text", tags: "text" });

export const Product = model<IProduct>("Product", productSchema);
