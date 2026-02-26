import { Router } from "express";
import {
    getCollections, getCollection, createCollection,
    updateCollection, deleteCollection,
} from "../controllers/collectionController";
import { protect, restrictTo } from "../middleware/auth";

const router = Router();

// Public — storefront can read collections
router.get("/", getCollections);
router.get("/:slug", getCollection);

// Admin only — create, update, delete
router.use(protect);
router.post("/", restrictTo("admin", "staff"), createCollection);
router.patch("/:id", restrictTo("admin", "staff"), updateCollection);
router.delete("/:id", restrictTo("admin"), deleteCollection);

export default router;
