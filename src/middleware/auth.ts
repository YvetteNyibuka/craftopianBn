import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest, JwtPayload } from "../types";
import { AppError } from "./errorHandler";

export const protect = (req: AuthRequest, _res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
        return next(new AppError("Authentication required. Please log in.", 401));
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
        req.user = decoded;
        next();
    } catch {
        next(new AppError("Invalid or expired token. Please log in again.", 401));
    }
};

export const restrictTo = (...roles: Array<"admin" | "staff">) => {
    return (req: AuthRequest, _res: Response, next: NextFunction): void => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next(new AppError("You do not have permission to perform this action.", 403));
        }
        next();
    };
};

/** Wraps an async controller to catch unhandled promise rejections */
export const asyncHandler =
    (fn: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>) =>
        (req: AuthRequest, res: Response, next: NextFunction): void => {
            Promise.resolve(fn(req, res, next)).catch(next);
        };
