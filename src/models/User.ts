/* eslint-disable @typescript-eslint/no-explicit-any */
import { Schema, model, Document, Types, HydratedDocument } from "mongoose";
import bcrypt from "bcryptjs";

// ── Address sub-document ──────────────────────────────────────────────────────

export interface IAddress {
    _id?: Types.ObjectId;
    label: string;           // "Home", "Work", etc.
    name: string;
    line1: string;
    line2?: string;
    city: string;
    postcode: string;
    country: string;
    phone?: string;
    isDefault: boolean;
}

const addressSchema = new Schema<IAddress>({
    label: { type: String, default: "Home", trim: true },
    name: { type: String, required: true, trim: true },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    postcode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    isDefault: { type: Boolean, default: false },
});

// ── User document ─────────────────────────────────────────────────────────────

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    role: "admin" | "staff" | "user";
    isActive: boolean;
    isEmailVerified: boolean;
    avatar?: string;
    phone?: string;
    dateOfBirth?: Date;
    // Account fields (end-users only)
    addresses: IAddress[];
    wishlist: Types.ObjectId[];     // Product refs
    // Admin/staff tracking
    lastLogin?: Date;
    passwordChangedAt?: Date;
    passwordResetToken?: string;
    passwordResetExpires?: Date;
    createdAt: Date;
    updatedAt: Date;
    // Methods
    comparePassword(candidate: string): Promise<boolean>;
    changedPasswordAfter(jwtTimestamp: number): boolean;
}

// ── Schema ────────────────────────────────────────────────────────────────────

const userSchema = new Schema<IUser>(
    {
        name: { type: String, required: true, trim: true, maxlength: 80 },
        email: {
            type: String, required: true, unique: true,
            lowercase: true, trim: true,
            match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
        },
        password: { type: String, required: true, select: false, minlength: 8 },
        role: { type: String, enum: ["admin", "staff", "user"], default: "user" },
        isActive: { type: Boolean, default: true },
        isEmailVerified: { type: Boolean, default: false },
        avatar: { type: String },
        phone: { type: String, trim: true },
        dateOfBirth: { type: Date },
        addresses: { type: [addressSchema], default: [] },
        wishlist: [{ type: Schema.Types.ObjectId, ref: "Product" }],
        lastLogin: { type: Date },
        passwordChangedAt: { type: Date },
        passwordResetToken: { type: String, select: false },
        passwordResetExpires: { type: Date, select: false },
    },
    { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────────────────

userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

// ── Pre-save: hash password ───────────────────────────────────────────────────

(userSchema as any).pre("save", async function (this: HydratedDocument<IUser>, next: () => void) {
    if (!this.isModified("password")) return next();
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    if (!this.isNew) this.passwordChangedAt = new Date(Date.now() - 1000);
    next();
});

// ── Methods ───────────────────────────────────────────────────────────────────

userSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
    return bcrypt.compare(candidate, this.password);
};

/** Returns true if the password was changed AFTER the JWT was issued */
userSchema.methods.changedPasswordAfter = function (jwtTimestamp: number): boolean {
    if (this.passwordChangedAt) {
        const changedAt = Math.floor(this.passwordChangedAt.getTime() / 1000);
        return changedAt > jwtTimestamp;
    }
    return false;
};

// ── Hide sensitive fields from JSON responses ────────────────────────────────

userSchema.set("toJSON", {
    transform: (_doc: any, ret: any) => {
        delete ret.password;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
        delete ret.passwordChangedAt;
        return ret;
    },
});

export const User = model<IUser>("User", userSchema);
