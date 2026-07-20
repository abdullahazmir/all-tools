import { connectDB } from "../config/db";
import { productsCollection } from "../models/product";

// A handful of products where a real photo of that exact model/brand was
// found on Wikimedia Commons (not just a category-generic photo). Most
// invented product titles in this seed data don't have a real matching
// photo anywhere, and correctly keep their category image instead of being
// forced into a mismatched "per-product" picture.
const PRODUCT_IMAGES: Record<string, string> = {
  "Steel Toe Safety Boots": "https://i.ibb.co/prbcKMhH/toolbazaar-product-steel-toe-safety-boots.jpg",
  "Welding Helmet Auto-Darkening": "https://i.ibb.co/ZRNkfp35/toolbazaar-product-welding-helmet-auto-darkening.jpg",
  "Klein Tools Long Nose Pliers (Restock)": "https://i.ibb.co/PZRb5SYN/toolbazaar-product-klein-tools-long-nose-pliers.jpg",
  "Klein Tools Long Nose Pliers": "https://i.ibb.co/PZRb5SYN/toolbazaar-product-klein-tools-long-nose-pliers.jpg",
  "Makita 9557NB Angle Grinder": "https://i.ibb.co/gLMMKCmg/toolbazaar-product-makita-9557nb-angle-grinder.jpg",
  "Klein Tools Linesman Pliers": "https://i.ibb.co/GfH5wsnb/toolbazaar-product-klein-tools-linesman-pliers.png",
};

async function updateProductImagesPerProduct() {
  await connectDB();
  const products = productsCollection();

  let updated = 0;
  for (const [title, image] of Object.entries(PRODUCT_IMAGES)) {
    const result = await products.updateMany({ title }, { $set: { images: [image] } });
    console.log(`${title}: updated ${result.modifiedCount} product(s)`);
    updated += result.modifiedCount;
  }

  console.log(`\nTotal updated: ${updated}`);
  process.exit(0);
}

updateProductImagesPerProduct().catch((err) => {
  console.error("Per-product image update failed:", err);
  process.exit(1);
});
