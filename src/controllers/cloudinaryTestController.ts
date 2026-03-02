import { Response } from "express";
import { AuthRequest } from "../types";
import { asyncHandler } from "../middleware/auth";

/**
 * GET /api/upload/config-test
 * Test Cloudinary configuration (for debugging)
 */
export const testCloudinaryConfig = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    res.json({
      status: "success",
      config: {
        cloudName: cloudName ? "✓ Set" : "✗ Missing",
        apiKey: apiKey ? `✓ Set (${apiKey.substring(0, 4)}...)` : "✗ Missing",
        apiSecret: apiSecret
          ? `✓ Set (${apiSecret.substring(0, 4)}...${apiSecret.substring(apiSecret.length - 4)})`
          : "✗ Missing",
        allConfigured: !!(cloudName && apiKey && apiSecret),
      },
    });
  },
);
