import { MetadataRoute } from "next";
import dbConnect, { PlaceModel } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await dbConnect();
  const places = await PlaceModel.find({ status: "verified" })
    .select("slug updatedAt")
    .lean();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://vanishingpoints.vercel.app";

  const placeUrls = places.map((place: any) => ({
    url: `${baseUrl}/place/${place.slug}`,
    lastModified: place.updatedAt || new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/list`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/submit`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    ...placeUrls,
  ];
}