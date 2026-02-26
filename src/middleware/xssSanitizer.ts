import { Request, Response, NextFunction } from "express";

/* Recursively strips HTML tags and dangerous characters from string values in
 * any nested object / array structure coming from req.body, req.query, req.params.
 * This prevents Stored XSS from making it into the database.
 */
const sanitizeValue = (value: unknown): unknown => {
    if (typeof value === "string") {
        return value
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#x27;")
            .replace(/\//g, "&#x2F;")
            .trim();
    }
    if (Array.isArray(value)) return value.map(sanitizeValue);
    if (value !== null && typeof value === "object") {
        return Object.fromEntries(
            Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, sanitizeValue(v)])
        );
    }
    return value;
};

export const xssSanitizer = (req: Request, _res: Response, next: NextFunction): void => {
    if (req.body) req.body = sanitizeValue(req.body);
    if (req.query) req.query = sanitizeValue(req.query) as Record<string, string>;
    if (req.params) req.params = sanitizeValue(req.params) as Record<string, string>;
    next();
};
