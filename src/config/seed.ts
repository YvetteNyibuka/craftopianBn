/**
 * Seed script — populates the DB with realistic starter data.
 * Run with: npm run seed
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "./db";
import { User } from "../models/User";
import { Collection } from "../models/Collection";
import { Product } from "../models/Product";
import { Customer } from "../models/Customer";
import { Order } from "../models/Order";
import { HomepageContent } from "../models/HomepageContent";

const seed = async () => {
    await connectDB();
    console.log("🌱 Seeding database…");

    // ── Wipe existing ─────────────────────────────────────────────────
    await Promise.all([
        User.deleteMany({}),
        Collection.deleteMany({}),
        Product.deleteMany({}),
        Customer.deleteMany({}),
        Order.deleteMany({}),
        HomepageContent.deleteMany({}),
    ]);

    // ── Admin user ────────────────────────────────────────────────────
    const admin = await User.create({
        name: "Admin",
        email: "admin@craftopia.com",
        password: "craftopia123",
        role: "admin",
    });
    console.log(`✅ Admin created: ${admin.email} / craftopia123`);

    // ── Collections ───────────────────────────────────────────────────
    const collections = await Collection.insertMany([
        { name: "Floral Arrangements", slug: "floral-arrangements", status: "active", isFeatured: true, showOnHomepage: true, productCount: 42, revenue: 3240 },
        { name: "Dried Flowers", slug: "dried-flowers", status: "active", isFeatured: true, showOnHomepage: true, productCount: 28, revenue: 1890 },
        { name: "Home Décor", slug: "home-decor", status: "active", showOnHomepage: true, productCount: 35, revenue: 2650 },
        { name: "Seasonal Specials", slug: "seasonal-specials", status: "inactive", productCount: 12, revenue: 560 },
        { name: "Gift Sets", slug: "gift-sets", status: "active", showOnHomepage: true, productCount: 7, revenue: 920 },
    ]);
    console.log(`✅ ${collections.length} collections created`);

    // ── Products ──────────────────────────────────────────────────────
    const products = await Product.insertMany([
        {
            title: "Ethereal White Roses",
            slug: "ethereal-white-roses",
            description: "A beautifully handcrafted bouquet of 12 premium white roses.",
            category: "Floral Arrangements",
            collectionId: collections[0]._id,
            price: 85,
            sku: "FLR-2024-001",
            stockCount: 42,
            isActive: true,
            isBestSeller: true,
            images: ["/images/decors/Image1.jpeg"],
            rating: 4.9,
            reviewsCount: 48,
        },
        {
            title: "Rustic Lavender Bundle",
            slug: "rustic-lavender-bundle",
            description: "Sun-dried lavender bundles sourced from Provence.",
            category: "Dried Flowers",
            collectionId: collections[1]._id,
            price: 32,
            sku: "DRY-2024-012",
            stockCount: 8,
            isActive: true,
            isNew: true,
            images: ["/images/decors/image2.jpeg"],
            rating: 4.7,
            reviewsCount: 23,
        },
        {
            title: "Minimalist Ceramic Vase",
            slug: "minimalist-ceramic-vase",
            description: "Matte finish ceramic with organic textures.",
            category: "Home Décor",
            collectionId: collections[2]._id,
            price: 45,
            sku: "DCR-2024-055",
            stockCount: 120,
            isActive: true,
            images: ["/images/decors/Image3.jpeg"],
            rating: 4.8,
            reviewsCount: 60,
        },
    ]);
    console.log(`✅ ${products.length} products created`);

    // ── Customers ─────────────────────────────────────────────────────
    const customers = await Customer.insertMany([
        { name: "Sarah Jenkins", email: "sarah@example.com", status: "Active", ordersCount: 5, totalSpent: 620 },
        { name: "Michael Chang", email: "michael@example.com", status: "Active", ordersCount: 2, totalSpent: 178 },
        { name: "Emma Woodhouse", email: "emma@example.com", status: "Active", ordersCount: 12, totalSpent: 1850.5 },
        { name: "David Silva", email: "david@example.com", status: "Inactive", ordersCount: 1, totalSpent: 45 },
    ]);
    console.log(`✅ ${customers.length} customers created`);

    // ── Orders ────────────────────────────────────────────────────────
    await Order.insertMany([
        {
            customer: customers[0]._id,
            customerName: "Sarah Jenkins",
            customerEmail: "sarah@example.com",
            items: [{ product: products[0]._id, title: "Ethereal White Roses", price: 85, quantity: 1 }],
            shippingAddress: { name: "Sarah Jenkins", line1: "14 Bluebell Lane", city: "Cairo", postcode: "11743", country: "Egypt" },
            subtotal: 85, shippingCost: 10, discount: 0, total: 95,
            status: "Delivered", paymentStatus: "Paid",
        },
        {
            customer: customers[1]._id,
            customerName: "Michael Chang",
            customerEmail: "michael@example.com",
            items: [{ product: products[1]._id, title: "Rustic Lavender Bundle", price: 32, quantity: 2 }],
            shippingAddress: { name: "Michael Chang", line1: "5 Garden St", city: "Cairo", postcode: "11561", country: "Egypt" },
            subtotal: 64, shippingCost: 10, discount: 0, total: 74,
            status: "Processing", paymentStatus: "Paid",
        },
    ]);
    console.log("✅ 2 orders created");

    // ── Homepage content ──────────────────────────────────────────────
    await HomepageContent.insertMany([{
        announcementEnabled: true,
        announcementText: "🌸 Free shipping on orders over $60 — limited time only!",
        heroBanners: [
            { heading: "Spring Renewal Collection", subheading: "Fresh flowers, timeless arrangements.", ctaLabel: "Shop Now", ctaLink: "/collections/floral-arrangements", visible: true, order: 0 },
        ],
        featuredCollections: collections.slice(0, 3).map((c, i) => ({ collectionId: c._id, name: String(c.name), visible: true, order: i })),
    }]);
    console.log("✅ Homepage content created");

    console.log("\n🎉 Database seeded successfully!");
    await mongoose.disconnect();
    process.exit(0);
};

seed().catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
});
