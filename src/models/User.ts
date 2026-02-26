/* eslint-disable @typescript-eslint/no-explicit-any */
import { Schema, model, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    role: "admin" | "staff";
    isActive: boolean;
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String, required: true, select: false, minlength: 8 },
        role: { type: String, enum: ["admin", "staff"], default: "staff" },
        isActive: { type: Boolean, default: true },
        lastLogin: { type: Date },
    },
    { timestamps: true }
);

// Hash password before saving
(userSchema as any).pre("save", async function (this: IUser, next: () => void) {
    if (!this.isModified("password")) return next();
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare hashed password
userSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
    return bcrypt.compare(candidate, this.password);
};

// Never expose password in JSON responses
userSchema.set("toJSON", {
    transform: (_doc: any, ret: any) => {
        delete ret.password;
        return ret;
    },
});

export const User = model<IUser>("User", userSchema);
