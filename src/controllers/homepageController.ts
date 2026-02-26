import { Response } from "express";
import { HomepageContent } from "../models/HomepageContent";
import { asyncHandler } from "../middleware/auth";
import { AuthRequest } from "../types";

/** GET /api/homepage  — always returns the single document */
export const getHomepage = asyncHandler(async (_req: AuthRequest, res: Response) => {
    let content = await HomepageContent.findOne();

    // Auto-create if doesn't exist yet
    if (!content) {
        content = await HomepageContent.create({});
    }

    res.json({ status: "success", data: content });
});

/** PATCH /api/homepage  — replace the single document */
export const updateHomepage = asyncHandler(async (req: AuthRequest, res: Response) => {
    let content = await HomepageContent.findOne();

    if (!content) {
        content = await HomepageContent.create(req.body);
    } else {
        Object.assign(content, req.body);
        await content.save();
    }

    res.json({ status: "success", data: content });
});
