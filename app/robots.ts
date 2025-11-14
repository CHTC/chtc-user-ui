import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      allow: ["/"],
      disallow: "/docs/admin-docs/",
    },
    sitemap: "https://badgercompute.wisc.edu/sitemap.xml",
    host: "https://badgercompute.wisc.edu",
  };
}
