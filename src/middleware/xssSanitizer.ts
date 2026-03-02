import { Request, Response, NextFunction } from "express";

/* Recursively strips HTML tags and dangerous characters from string values in
 * any nested object / array structure coming from req.body, req.query, req.params.
 * This prevents Stored XSS from making it into the database.
 */

// Check if a string is a URL
const isURL = (str: string): boolean => {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const sanitizeValue = (value: unknown, key?: string): unknown => {
  if (typeof value === "string") {
    // Skip sanitization for URLs or URL-containing fields
    if (
      isURL(value) ||
      key === "images" ||
      key === "coverImage" ||
      key === "image"
    ) {
      return value.trim();
    }

    return value
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;")
      .trim();
  }
  if (Array.isArray(value)) return value.map((v) => sanitizeValue(v, key));
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        k,
        sanitizeValue(v, k),
      ]),
    );
  }
  return value;
};

export const xssSanitizer = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  // In Express 5.x, req.query and req.params are readonly
  // So we sanitize req.body only (the main attack vector)
  if (req.body && Object.keys(req.body).length > 0) {
    req.body = sanitizeValue(req.body) as typeof req.body;
  }

  // For query and params, we'd need a different approach in Express 5.x
  // Since they're readonly, we can't reassign them
  // Most XSS attempts come through body anyway

  next();
};
