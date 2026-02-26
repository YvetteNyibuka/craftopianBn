import rateLimit from "express-rate-limit";

// ── General API rate limiter ──────────────────────────────────────────────────
// 300 requests per 15 minutes per IP — protects every route
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,   // 15 minutes
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: "error",
        message: "Too many requests from this IP. Please wait 15 minutes and try again.",
    },
});

// ── Auth routes limiter ───────────────────────────────────────────────────────
// Strict: 10 attempts per 15 minutes — prevents brute-force login/signup
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // only count failed requests
    message: {
        status: "error",
        message: "Too many login attempts. Please wait 15 minutes before trying again.",
    },
});

// ── Password reset / sensitive operations ─────────────────────────────────────
export const sensitiveLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,   // 1 hour
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: "error",
        message: "Too many sensitive requests. Please try again after an hour.",
    },
});
