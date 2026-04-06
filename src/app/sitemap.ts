import { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://threatcast.io", lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: "https://threatcast.io/sign-in", lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: "https://threatcast.io/sign-up", lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: "https://threatcast.io/terms", lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: "https://threatcast.io/privacy", lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: "https://threatcast.io/changelog", lastModified: new Date(), changeFrequency: "weekly", priority: 0.5 },
  ];
}
