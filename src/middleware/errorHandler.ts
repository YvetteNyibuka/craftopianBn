import { Request, Response, NextFunction } from "express";

export class AppError extends Error {
    public statusCode: number;
    public isOperational: boolean;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

export const errorHandler = (
    err: Error | AppError,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    // Mongoose duplicate key error
    if ((err as any).code === 11000) {
        const field = Object.keys((err as any).keyValue)[0];
        res.status(409).json({
            status: "error",
            message: `A record with this ${field} already exists.`,
        });
        return;
    }

    // Mongoose validation error
    if (err.name === "ValidationError") {
        const messages = Object.values((err as any).errors).map((e: any) => e.message);
        res.status(400).json({ status: "error", message: messages.join(", ") });
        return;
    }

    // JWT errors
    if (err.name === "JsonWebTokenError") {
        res.status(401).json({ status: "error", message: "Invalid token. Please log in again." });
        return;
    }
    if (err.name === "TokenExpiredError") {
        res.status(401).json({ status: "error", message: "Your session has expired. Please log in again." });
        return;
    }

    // Known operational errors
    const statusCode = (err as AppError).statusCode ?? 500;
    const message = (err as AppError).isOperational ? err.message : "Something went wrong. Please try again.";

    if (process.env.NODE_ENV === "development") {
        res.status(statusCode).json({ status: "error", message, stack: err.stack });
    } else {
        res.status(statusCode).json({ status: "error", message });
    }
};
