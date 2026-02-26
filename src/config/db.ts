import mongoose from "mongoose";

export const connectDB = async (): Promise<void> => {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI is not defined in environment variables");

    try {
        const conn = await mongoose.connect(uri);
        console.log(`✅  MongoDB connected: ${conn.connection.host}`);
    } catch (err) {
        console.error("❌  MongoDB connection error:", err);
        process.exit(1);
    }
};

// Graceful shutdown
process.on("SIGINT", async () => {
    await mongoose.connection.close();
    console.log("MongoDB disconnected on app termination");
    process.exit(0);
});
