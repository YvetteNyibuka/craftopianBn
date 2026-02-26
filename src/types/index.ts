import { Request, Response, NextFunction } from "express";

// ── Shared enums ────────────────────────────────────────────────────────────

export type OrderStatus = "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled";
export type CustomerStatus = "Active" | "Inactive";
export type CollectionStatus = "active" | "inactive";
export type SortOrder = "manual" | "best-selling" | "price-asc" | "price-desc" | "newest" | "alpha-asc";
export type UserRole = "admin" | "staff" | "user";

// ── JWT payload ──────────────────────────────────────────────────────────────

export interface JwtPayload {
    id: string;
    email: string;
    role: UserRole;
    iat?: number;   // issued at (added by jwt.verify)
}

// ── Authenticated request ────────────────────────────────────────────────────

export interface AuthRequest extends Request {
    user?: JwtPayload;
}

// ── Controller handler type ──────────────────────────────────────────────────

export type AsyncHandler = (
    req: Request,
    res: Response,
    next: NextFunction
) => Promise<void>;

// ── Pagination ───────────────────────────────────────────────────────────────

export interface PaginationQuery {
    page?: string;
    limit?: string;
    sort?: string;
    order?: "asc" | "desc";
    search?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pages: number;
    limit: number;
}
