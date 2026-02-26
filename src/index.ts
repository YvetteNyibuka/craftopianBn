import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { connectDB } from "./config/db";
import { errorHandler } from "./middleware/errorHandler";

// ── Route imports ─────────────────────────────────────────────────────────────
import authRoutes from "./routes/auth";
import collectionRoutes from "./routes/collections";
import productRoutes from "./routes/products";
import orderRoutes from "./routes/orders";
import customerRoutes from "./routes/customers";
import homepageRoutes from "./routes/homepage";

// ── App setup ─────────────────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT ?? 5000;

// ── Security middleware ───────────────────────────────────────────────────────
app.use(helmet());
app.use(
    cors({
        origin: process.env.CLIENT_URL ?? "http://localhost:3002",
        credentials: true,
    })
);

// ── Request parsing ───────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Logging ───────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
    app.use(morgan("dev"));
}

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
    res.json({
        status: "ok",
        service: "Craftopia API",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
    });
});

// ── API routes ────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/collections", collectionRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/homepage", homepageRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ status: "error", message: "Route not found." });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start server ──────────────────────────────────────────────────────────────
const start = async () => {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`\n🚀 Craftopia API running on http://localhost:${PORT}`);
        console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
        console.log(`📦 Environment: ${process.env.NODE_ENV ?? "development"}\n`);
    });
};

start();

export default app;
