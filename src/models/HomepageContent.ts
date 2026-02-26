import { Schema, model, Document } from "mongoose";

interface IHeroBanner {
    heading: string;
    subheading?: string;
    ctaLabel: string;
    ctaLink: string;
    image?: string;
    visible: boolean;
    order: number;
}

interface IFeaturedCollection {
    collectionId: Schema.Types.ObjectId;
    name: string;
    visible: boolean;
    order: number;
}

export interface IHomepageContent extends Document {
    announcementEnabled: boolean;
    announcementText: string;
    heroBanners: IHeroBanner[];
    featuredCollections: IFeaturedCollection[];
    sections: {
        heroEnabled: boolean;
        featuredEnabled: boolean;
        bestSellersEnabled: boolean;
        reviewsEnabled: boolean;
        newsletterEnabled: boolean;
        instagramEnabled: boolean;
        sustainabilityEnabled: boolean;
    };
    updatedAt: Date;
}

const homepageSchema = new Schema<IHomepageContent>(
    {
        announcementEnabled: { type: Boolean, default: true },
        announcementText: { type: String, default: "" },
        heroBanners: [
            {
                heading: { type: String, required: true },
                subheading: { type: String },
                ctaLabel: { type: String, default: "Shop Now" },
                ctaLink: { type: String, required: true },
                image: { type: String },
                visible: { type: Boolean, default: true },
                order: { type: Number, default: 0 },
            },
        ],
        featuredCollections: [
            {
                collectionId: { type: Schema.Types.ObjectId, ref: "Collection" },
                name: { type: String },
                visible: { type: Boolean, default: true },
                order: { type: Number, default: 0 },
            },
        ],
        sections: {
            heroEnabled: { type: Boolean, default: true },
            featuredEnabled: { type: Boolean, default: true },
            bestSellersEnabled: { type: Boolean, default: true },
            reviewsEnabled: { type: Boolean, default: false },
            newsletterEnabled: { type: Boolean, default: true },
            instagramEnabled: { type: Boolean, default: true },
            sustainabilityEnabled: { type: Boolean, default: true },
        },
    },
    { timestamps: true }
);

export const HomepageContent = model<IHomepageContent>("HomepageContent", homepageSchema);
