// src/data/productImages.ts
// Local images live in /public/images so they are available at /images/...

export type ImageMap = Record<string, string>;

const IMG = (file: string) => `/images/${file}`;

/**
 * Keys are lowercase product names (or slugs). Values are public paths.
 * Add or adjust any filename here if your actual extension differs.
 */
export const productImageMap: ImageMap = {
  "carnation charm": IMG("carnation_charm.webp"),
  "cloudy gypsophila": IMG("cloudy_gypsophila.jpg"),
  "daisy daylight": IMG("daisy_daylight.jpeg"),
  "hydrangea hues": IMG("hydrangea_hues.jpeg"),
  "lavender breeze": IMG("lavender_breeze.jpg"),
  "orchid delight": IMG("orchid_delight.jpg"),
  "red rose bouquet": IMG("red_rose_bouquet.jpg"),
  "royal iris": IMG("royal_iris.jpg"),
  "white lily arrangement": IMG("white_lily_arrangement.jpg"),

  // if your file is spelled differently, change this value only:
  "autumn chrysanthemum": IMG("autumn_chrysanthemum.jpeg"),


};

// tiny slugify used as a last-resort guess
const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/** Resolve the best image path for a product */
export function resolveProductImage(name?: string, slug?: string): string {
  const n = (name || "").trim().toLowerCase();
  const s = (slug || "").trim().toLowerCase();

  // 1) exact by name
  if (n && productImageMap[n]) return productImageMap[n];

  // 2) try by slug (if you ever add slug keys to the map)
  if (s && productImageMap[s]) return productImageMap[s];

  // 3) try by derived slug from name (common for "lavender breeze" -> lavender_breeze)
  const derived = slugify(n).replace(/_/g, "-");
  if (derived && productImageMap[derived]) return productImageMap[derived];

  // 4) fallback placeholder
  return "/images/placeholder.png";
}
