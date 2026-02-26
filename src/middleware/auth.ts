import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { AuthRequest, JwtPayload, UserRole } from "../types";
import { AppError } from "./errorHandler";

// ── Sign JWT ──────────────────────────────────────────────────────────────────

export const signToken = (id: string, email: string, role: UserRole): string =>
    jwt.sign({ id, email, role }, process.env.JWT_SECRET!, {
        expiresIn: (process.env.JWT_EXPIRES_IN ?? "7d") as string,
    } as object);

// ── Protect: verify JWT + check if user still exists + check password change ──

export const protect = async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith("Bearer ")) {
            return next(new AppError("Authentication required. Please log in.", 401));
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

        // Check user still exists (catches deleted accounts)
        const user = await User.findById(decoded.id);
        if (!user) {
            return next(new AppError("The user belonging to this token no longer exists.", 401));
        }

        // Check if account is active
        if (!user.isActive) {
            return next(new AppError("Your account has been deactivated. Please contact support.", 403));
        }

        // Check if password was changed after token was issued
        if (decoded.iat && user.changedPasswordAfter(decoded.iat)) {
            return next(new AppError("Your password was recently changed. Please log in again.", 401));
        }

        req.user = { id: decoded.id, email: decoded.email, role: decoded.role, iat: decoded.iat };
        next();
    } catch {
        next(new AppError("Invalid or expired token. Please log in again.", 401));
    }
};

// ── Restrict to specific roles ────────────────────────────────────────────────

export const restrictTo = (...roles: UserRole[]) =>
    (req: AuthRequest, _res: Response, next: NextFunction): void => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next(new AppError("You do not have permission to perform this action.", 403));
        }
        next();
    };

// ── optionalAuth: attach user if token present, but don't block if absent ─────
// Useful for public routes where auth changes the response (e.g., wishlisted state)

export const optionalAuth = async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) return next();

    try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
        const user = await User.findById(decoded.id);
        if (user?.isActive) req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
    } catch {
        // Silently ignore — request proceeds as unauthenticated
    }
    next();
};

// ── asyncHandler ──────────────────────────────────────────────────────────────

export const asyncHandler =
    (fn: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>) =>
        (req: AuthRequest, res: Response, next: NextFunction): void => {
            Promise.resolve(fn(req, res, next)).catch(next);
        };
