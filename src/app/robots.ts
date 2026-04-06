import { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/portal/", "/admin/", "/api/", "/shared/"] },
    ],
    sitemap: "https://threatcast.io/sitemap.xml",
  };
}
