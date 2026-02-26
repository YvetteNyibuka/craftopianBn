import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import compression from "compression";
import cookieParser from "cookie-parser";

import { connectDB } from "./config/db";
import { errorHandler } from "./middleware/errorHandler";
import { apiLimiter } from "./middleware/rateLimiter";
import { xssSanitizer } from "./middleware/xssSanitizer";

// ── Route imports ─────────────────────────────────────────────────────────────
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import cartRoutes from "./routes/cart";
import collectionRoutes from "./routes/collections";
import productRoutes from "./routes/products";
import orderRoutes from "./routes/orders";
import customerRoutes from "./routes/customers";
import homepageRoutes from "./routes/homepage";

// ── App + port ────────────────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT ?? 5000;

// ════════════════════════════════════════════════════════
//  SECURITY MIDDLEWARE STACK
// ════════════════════════════════════════════════════════

// 1. Trust first proxy (needed for rate-limiter to use real IP behind Nginx/Heroku)
app.set("trust proxy", 1);

// 2. Helmet — sets 14 security-related HTTP headers
app.use(
    helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" }, // allow images from CDN
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:"],
                scriptSrc: ["'self'"],
            },
        },
    })
);

// 3. CORS — only allow our frontend origin
app.use(
    cors({
        origin: process.env.CLIENT_URL ?? "http://localhost:3002",
        credentials: true,                    // allow cookies
        methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

// 4. Global rate limiter — applies to every route (300 req / 15 min / IP)
app.use("/api", apiLimiter);

// 5. Body parsing (before sanitisation)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// 6. MongoDB NoSQL injection sanitiser — strips $ and . from user input
app.use(mongoSanitize());

// 7. XSS sanitiser — HTML-encodes dangerous chars in all string inputs
app.use(xssSanitizer);

// 8. HPP — HTTP Parameter Pollution: keeps last value for duplicate query params
app.use(
    hpp({
        whitelist: ["price", "rating", "category"], // allowed to be arrays
    })
);

// 9. Gzip compression (skips small payloads < 1KB automatically)
app.use(compression());

// 10. HTTP request logging (dev: coloured, prod: combined format)
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// ════════════════════════════════════════════════════════
//  HEALTH CHECK (no auth, no rate limit)
// ════════════════════════════════════════════════════════

app.get("/api/health", (_req, res) => {
    res.json({
        status: "ok",
        service: "Craftopia API",
        version: "1.0.0",
        environment: process.env.NODE_ENV ?? "development",
        timestamp: new Date().toISOString(),
    });
});

// ════════════════════════════════════════════════════════
//  API ROUTES
// ════════════════════════════════════════════════════════

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/collections", collectionRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/homepage", homepageRoutes);

// ════════════════════════════════════════════════════════
//  CATCH-ALL 404
// ════════════════════════════════════════════════════════

app.use((_req, res) => {
    res.status(404).json({ status: "error", message: "Route not found." });
});

// ════════════════════════════════════════════════════════
//  GLOBAL ERROR HANDLER (must be last)
// ════════════════════════════════════════════════════════

app.use(errorHandler);

// ════════════════════════════════════════════════════════
//  START SERVER
// ════════════════════════════════════════════════════════

const start = async () => {
    await connectDB();
    app.listen(PORT, () => {
        console.log("\n╔══════════════════════════════════════╗");
        console.log(`║  🚀 Craftopia API                    ║`);
        console.log(`║  http://localhost:${PORT}              ║`);
        console.log(`║  ENV: ${(process.env.NODE_ENV ?? "development").padEnd(29)}║`);
        console.log("╚══════════════════════════════════════╝\n");
        console.log("  Security:  Helmet ✓  CORS ✓  Rate-limit ✓");
        console.log("             Mongo-sanitize ✓  XSS ✓  HPP ✓");
        console.log(`\n  Health:    http://localhost:${PORT}/api/health\n`);
    });
};

start();

export default app;
