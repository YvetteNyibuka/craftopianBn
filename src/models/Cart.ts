/* eslint-disable @typescript-eslint/no-explicit-any */
import { Schema, model, Document, Types } from "mongoose";

export interface ICartItem {
  product: Types.ObjectId;
  title: string;
  image?: string;
  price: number;
  quantity: number;
  variant?: string;
}

export interface ICart extends Document {
  user: Types.ObjectId;
  items: ICartItem[];
  couponCode?: string;
  discount: number;
  createdAt: Date;
  updatedAt: Date;
  // Virtuals
  subtotal: number;
  total: number;
  itemCount: number;
}

const cartItemSchema = new Schema<ICartItem>({
  product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  title: { type: String, required: true },
  image: { type: String },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1, max: 99 },
  variant: { type: String },
});

const cartSchema = new Schema<ICart>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: { type: [cartItemSchema], default: [] },
    couponCode: { type: String, trim: true, uppercase: true },
    discount: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

cartSchema.virtual("subtotal").get(function (this: ICart) {
  return this.items.reduce(
    (sum: number, item: ICartItem) => sum + item.price * item.quantity,
    0,
  );
});

cartSchema.virtual("total").get(function (this: ICart) {
  const subtotal = this.items.reduce(
    (sum: number, item: ICartItem) => sum + item.price * item.quantity,
    0,
  );
  return Math.max(0, subtotal - this.discount);
});

cartSchema.virtual("itemCount").get(function (this: ICart) {
  return this.items.reduce(
    (sum: number, item: ICartItem) => sum + item.quantity,
    0,
  );
});

// Note: user already has unique index from schema definition

export const Cart = model<ICart>("Cart", cartSchema);
