/* eslint-disable @typescript-eslint/no-explicit-any */
import { Response } from "express";
import { User } from "../models/User";
import { AppError } from "../middleware/errorHandler";
import { asyncHandler } from "../middleware/auth";
import { AuthRequest } from "../types";

// ── GET /api/users/me/addresses ───────────────────────────────────────────────

export const getAddresses = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await User.findById(req.user!.id).select("addresses");
    if (!user) throw new AppError("User not found.", 404);
    res.json({ status: "success", data: user.addresses });
});

// ── POST /api/users/me/addresses ──────────────────────────────────────────────

export const addAddress = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await User.findById(req.user!.id);
    if (!user) throw new AppError("User not found.", 404);

    if (user.addresses.length >= 10) {
        throw new AppError("Maximum of 10 addresses allowed.", 400);
    }

    const { label, name, line1, line2, city, postcode, country, phone, isDefault } = req.body;

    if (!name || !line1 || !city || !postcode || !country) {
        throw new AppError("Name, line1, city, postcode, and country are required.", 400);
    }

    if (isDefault) {
        user.addresses.forEach((a) => { a.isDefault = false; });
    }

    user.addresses.push({ label, name, line1, line2, city, postcode, country, phone, isDefault: isDefault ?? false });
    await user.save();

    res.status(201).json({ status: "success", data: user.addresses });
});

// ── PATCH /api/users/me/addresses/:addressId ──────────────────────────────────

export const updateAddress = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await User.findById(req.user!.id);
    if (!user) throw new AppError("User not found.", 404);

    const address = (user.addresses as any).id(req.params.addressId);
    if (!address) throw new AppError("Address not found.", 404);

    const { label, name, line1, line2, city, postcode, country, phone, isDefault } = req.body;

    if (isDefault) user.addresses.forEach((a) => { a.isDefault = false; });

    if (label !== undefined) address.label = label;
    if (name !== undefined) address.name = name;
    if (line1 !== undefined) address.line1 = line1;
    if (line2 !== undefined) address.line2 = line2;
    if (city !== undefined) address.city = city;
    if (postcode !== undefined) address.postcode = postcode;
    if (country !== undefined) address.country = country;
    if (phone !== undefined) address.phone = phone;
    if (isDefault !== undefined) address.isDefault = isDefault;

    await user.save();
    res.json({ status: "success", data: user.addresses });
});

// ── DELETE /api/users/me/addresses/:addressId ─────────────────────────────────

export const deleteAddress = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await User.findById(req.user!.id);
    if (!user) throw new AppError("User not found.", 404);

    const address = (user.addresses as any).id(req.params.addressId);
    if (!address) throw new AppError("Address not found.", 404);

    address.deleteOne();
    await user.save();

    res.json({ status: "success", data: user.addresses });
});

// ── PATCH /api/users/me/addresses/:addressId/default ─────────────────────────

export const setDefaultAddress = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await User.findById(req.user!.id);
    if (!user) throw new AppError("User not found.", 404);

    const address = (user.addresses as any).id(req.params.addressId);
    if (!address) throw new AppError("Address not found.", 404);

    user.addresses.forEach((a) => { a.isDefault = false; });
    address.isDefault = true;

    await user.save();
    res.json({ status: "success", data: user.addresses });
});
