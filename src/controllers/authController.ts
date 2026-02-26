import { Response } from "express";
import crypto from "crypto";
import { User } from "../models/User";
import { AppError } from "../middleware/errorHandler";
import { asyncHandler, signToken } from "../middleware/auth";
import { AuthRequest } from "../types";

// ── Helper: send token response ───────────────────────────────────────────────

const sendAuthResponse = (res: Response, statusCode: number, user: InstanceType<typeof User>) => {
    const token = signToken(user.id, user.email, user.role);

    // Secure HTTP-only cookie (optional — client can also use Authorization header)
    res.cookie("jwt", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    });

    res.status(statusCode).json({ status: "success", token, data: { user } });
};

// ── POST /api/auth/signup  — public end-user registration ────────────────────

export const signup = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
        throw new AppError("Name, email, and password are required.", 400);
    }
    if (password.length < 8) {
        throw new AppError("Password must be at least 8 characters.", 400);
    }

    const existing = await User.findOne({ email });
    if (existing) throw new AppError("An account with this email already exists.", 409);

    const user = await User.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password,
        phone: phone?.trim(),
        role: "user",           // always "user" — never trust client role
    });

    sendAuthResponse(res, 201, user);
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────

export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) throw new AppError("Please provide email and password.", 400);

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
        throw new AppError("Incorrect email or password.", 401);
    }
    if (!user.isActive) throw new AppError("Your account has been deactivated. Please contact support.", 403);

    await User.findByIdAndUpdate(user.id, { lastLogin: new Date() });

    sendAuthResponse(res, 200, user);
});

// ── POST /api/auth/admin-register  — create staff/admin (admin only) ──────────

export const adminRegister = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, email, password, role } = req.body;

    if (!["admin", "staff"].includes(role)) {
        throw new AppError("Role must be 'admin' or 'staff' for this endpoint.", 400);
    }

    const existing = await User.findOne({ email });
    if (existing) throw new AppError("An account with this email already exists.", 409);

    const user = await User.create({ name, email, password, role });

    res.status(201).json({ status: "success", data: { user } });
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────

export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await User.findById(req.user!.id).populate("wishlist", "title slug images price");
    if (!user) throw new AppError("User not found.", 404);
    res.json({ status: "success", data: { user } });
});

// ── PATCH /api/auth/update-me  — update name, email, phone, avatar ───────────

export const updateMe = asyncHandler(async (req: AuthRequest, res: Response) => {
    // Block password change through this route
    if (req.body.password || req.body.passwordConfirm) {
        throw new AppError("This route is not for password updates. Use /change-password.", 400);
    }
    // Block role escalation
    if (req.body.role) {
        throw new AppError("You cannot change your role through this endpoint.", 403);
    }

    const allowed = ["name", "email", "phone", "avatar", "dateOfBirth"] as const;
    const updates: Record<string, unknown> = {};
    allowed.forEach((field) => {
        if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user!.id, updates, {
        new: true,
        runValidators: true,
    });

    res.json({ status: "success", data: { user } });
});

// ── PATCH /api/auth/change-password ──────────────────────────────────────────

export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        throw new AppError("Please provide current and new password.", 400);
    }
    if (newPassword.length < 8) {
        throw new AppError("New password must be at least 8 characters.", 400);
    }

    const user = await User.findById(req.user!.id).select("+password");
    if (!user) throw new AppError("User not found.", 404);

    if (!(await user.comparePassword(currentPassword))) {
        throw new AppError("Current password is incorrect.", 400);
    }
    if (currentPassword === newPassword) {
        throw new AppError("New password must be different from current password.", 400);
    }

    user.password = newPassword;
    await user.save(); // triggers pre-save hook → hashes & sets passwordChangedAt

    sendAuthResponse(res, 200, user);
});

// ── POST /api/auth/logout ─────────────────────────────────────────────────────

export const logout = asyncHandler(async (_req: AuthRequest, res: Response) => {
    res.cookie("jwt", "loggedout", {
        httpOnly: true,
        expires: new Date(Date.now() + 10 * 1000), // expires in 10 seconds
    });
    res.json({ status: "success", message: "Logged out successfully." });
});

// ── POST /api/auth/forgot-password ───────────────────────────────────────────

export const forgotPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await User.findOne({ email: req.body.email?.toLowerCase() });
    if (!user) {
        // Don't reveal whether the email exists — return success regardless
        res.json({ status: "success", message: "If this email is registered, a reset link has been sent." });
        return;
    }

    // Generate raw token → store hashed version
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashed = crypto.createHash("sha256").update(resetToken).digest("hex");

    await User.findByIdAndUpdate(user.id, {
        passwordResetToken: hashed,
        passwordResetExpires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    // TODO: send reset email with:
    // `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`
    console.log(`[DEV] Password reset token for ${user.email}: ${resetToken}`);

    res.json({
        status: "success",
        message: "If this email is registered, a reset link has been sent.",
        ...(process.env.NODE_ENV === "development" && { devToken: resetToken }),
    });
});

// ── POST /api/auth/reset-password ────────────────────────────────────────────

export const resetPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
        throw new AppError("Token and new password are required.", 400);
    }
    if (newPassword.length < 8) {
        throw new AppError("Password must be at least 8 characters.", 400);
    }

    const hashed = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
        passwordResetToken: hashed,
        passwordResetExpires: { $gt: Date.now() },
    }).select("+password");

    if (!user) throw new AppError("Invalid or expired reset token.", 400);

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    sendAuthResponse(res, 200, user);
});

// ── DELETE /api/auth/delete-me ────────────────────────────────────────────────

export const deleteMe = asyncHandler(async (req: AuthRequest, res: Response) => {
    // Soft-delete: just deactivate — never permanently delete user data
    await User.findByIdAndUpdate(req.user!.id, { isActive: false });
    res.cookie("jwt", "loggedout", { httpOnly: true, expires: new Date(Date.now() + 10 * 1000) });
    res.status(204).send();
});
