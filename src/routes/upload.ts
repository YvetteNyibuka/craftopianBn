import { Router } from "express";
import {
  uploadImage,
  deleteImage,
  uploadMultipleImages,
} from "../controllers/uploadController";
import { testCloudinaryConfig } from "../controllers/cloudinaryTestController";
import { upload } from "../middleware/upload";
import { protect } from "../middleware/auth";

const router = Router();

// Test endpoint (no auth required for debugging)
router.get("/config-test", testCloudinaryConfig);

// All upload routes require authentication
router.use(protect);

// Single image upload
router.post("/", upload.single("file"), uploadImage);

// Multiple images upload
router.post("/multiple", upload.array("files", 4), uploadMultipleImages);

// Delete image
router.delete("/", deleteImage);

export default router;
