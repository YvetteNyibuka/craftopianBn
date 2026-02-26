import { Response } from "express";
import jwt, { SignOptions } from "jsonwebtoken";
import { User } from "../models/User";
import { AppError } from "../middleware/errorHandler";
import { asyncHandler } from "../middleware/auth";
import { AuthRequest } from "../types";

const signToken = (id: string, email: string, role: string) =>
    jwt.sign({ id, email, role }, process.env.JWT_SECRET!, {
        expiresIn: (process.env.JWT_EXPIRES_IN ?? "7d") as SignOptions["expiresIn"],
    });


/** POST /api/auth/register */
export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, email, password, role } = req.body;

    const existing = await User.findOne({ email });
    if (existing) throw new AppError("An account with this email already exists.", 409);

    const user = await User.create({ name, email, password, role: role ?? "staff" });
    const token = signToken(user.id, user.email, user.role);

    res.status(201).json({ status: "success", token, data: { user } });
});

/** POST /api/auth/login */
export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) throw new AppError("Please provide email and password.", 400);

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
        throw new AppError("Incorrect email or password.", 401);
    }
    if (!user.isActive) throw new AppError("Your account has been deactivated.", 403);

    await User.findByIdAndUpdate(user.id, { lastLogin: new Date() });
    const token = signToken(user.id, user.email, user.role);

    res.json({ status: "success", token, data: { user } });
});

/** GET /api/auth/me */
export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await User.findById(req.user!.id);
    if (!user) throw new AppError("User not found.", 404);
    res.json({ status: "success", data: { user } });
});

/** PATCH /api/auth/change-password */
export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user!.id).select("+password");
    if (!user) throw new AppError("User not found.", 404);

    if (!(await user.comparePassword(currentPassword))) {
        throw new AppError("Current password is incorrect.", 400);
    }

    user.password = newPassword;
    await user.save();

    const token = signToken(user.id, user.email, user.role);
    res.json({ status: "success", token, message: "Password updated successfully." });
});
