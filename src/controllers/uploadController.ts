import { Response } from "express";
import { AuthRequest } from "../types";
import { asyncHandler } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import cloudinary from "../config/cloudinary";
import { Readable } from "stream";

/**
 * POST /api/upload
 * Upload single image to Cloudinary
 */
export const uploadImage = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      throw new AppError("No file provided", 400);
    }

    const folder = (req.body.folder as string) || "general";

    // Validate Cloudinary config
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      throw new AppError(
        "Cloudinary configuration missing. Please check environment variables.",
        500,
      );
    }

    try {
      // Convert buffer to stream for Cloudinary
      const stream = Readable.from(req.file.buffer);

      // Upload to Cloudinary using stream
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `craftopia/${folder}`,
            resource_type: "auto",
          },
          (error, result) => {
            if (error) {
              console.error("Cloudinary upload error details:", {
                message: error.message,
                http_code: error.http_code,
              });
              reject(error);
            } else {
              resolve(result);
            }
          },
        );

        stream.pipe(uploadStream);
      });

      const uploadResult = result as { secure_url: string; public_id: string };

      res.status(200).json({
        status: "success",
        data: {
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
        },
      });
    } catch (error: any) {
      console.error("Cloudinary upload error:", error);
      throw new AppError(error.message || "Upload failed", 500);
    }
  },
);

/**
 * DELETE /api/upload
 * Delete image from Cloudinary by public_id
 */
export const deleteImage = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { publicId } = req.body;

    if (!publicId) {
      throw new AppError("No publicId provided", 400);
    }

    try {
      await cloudinary.uploader.destroy(publicId);

      res.status(200).json({
        status: "success",
        message: "Image deleted successfully",
      });
    } catch (error: any) {
      console.error("Cloudinary delete error:", error);
      throw new AppError(error.message || "Delete failed", 500);
    }
  },
);

/**
 * POST /api/upload/multiple
 * Upload multiple images to Cloudinary (1-4 images for products)
 */
export const uploadMultipleImages = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      throw new AppError("No files provided", 400);
    }

    const folder = (req.body.folder as string) || "general";
    const files = req.files as Express.Multer.File[];
    const maxImages = 4;

    // Validate image count
    if (files.length > maxImages) {
      throw new AppError(`Maximum ${maxImages} images allowed`, 400);
    }

    const uploadedImages: Array<{ url: string; publicId: string }> = [];
    const errors: string[] = [];

    // Upload images one by one to handle individual failures
    for (let i = 0; i < files.length; i++) {
      try {
        const file = files[i];
        const stream = Readable.from(file.buffer);

        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: `craftopia/${folder}`,
              resource_type: "auto",
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            },
          );

          stream.pipe(uploadStream);
        });

        const uploadResult = result as {
          secure_url: string;
          public_id: string;
        };
        uploadedImages.push({
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
        });
      } catch (error: any) {
        console.error(`Failed to upload image ${i + 1}:`, error.message);
        errors.push(`Image ${i + 1}: ${error.message}`);
      }
    }

    // If no images uploaded successfully, return error
    if (uploadedImages.length === 0) {
      throw new AppError(`All uploads failed: ${errors.join(", ")}`, 500);
    }

    // Return success with uploaded images and any errors
    const response: any = {
      status: "success",
      data: uploadedImages,
      uploaded: uploadedImages.length,
      total: files.length,
    };

    if (errors.length > 0) {
      response.warnings = errors;
      response.message = `${uploadedImages.length} of ${files.length} images uploaded successfully`;
    }

    res.status(200).json(response);
  },
);

/**
 * Helper: Extract public_id from Cloudinary URL
 */
export const extractPublicId = (url: string): string | null => {
  try {
    // Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{folder}/{public_id}.{ext}
    const parts = url.split("/");
    const uploadIndex = parts.indexOf("upload");
    if (uploadIndex === -1) return null;

    // Get everything after 'upload/v{version}/'
    const afterUpload = parts.slice(uploadIndex + 2).join("/");
    // Remove file extension
    const publicId = afterUpload.replace(/\.[^/.]+$/, "");
    return publicId;
  } catch (error) {
    console.error("Error extracting public_id:", error);
    return null;
  }
};

/**
 * Helper: Delete multiple images from Cloudinary
 */
export const deleteMultipleImages = async (
  urls: string[],
): Promise<{ deleted: number; failed: number; errors: string[] }> => {
  const results = {
    deleted: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const url of urls) {
    try {
      const publicId = extractPublicId(url);
      if (!publicId) {
        results.failed++;
        results.errors.push(`Invalid URL format: ${url}`);
        continue;
      }

      await cloudinary.uploader.destroy(publicId);
      results.deleted++;
    } catch (error: any) {
      results.failed++;
      results.errors.push(`${url}: ${error.message}`);
      console.error(`Failed to delete ${url}:`, error.message);
    }
  }

  return results;
};
