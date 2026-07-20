import { connectDB } from "../config/db";
import { productsCollection } from "../models/product";

// Real, category-accurate product photos (Wikimedia Commons, openly licensed),
// re-hosted on ImgBB — replaces the earlier generic/unrelated placeholder photos.
const CATEGORY_IMAGES: Record<string, string> = {
  "power-tools": "https://i.ibb.co/MxcrSssM/toolbazaar-real-power-tools.jpg",
  "hand-tools": "https://i.ibb.co/yHY3SCh/toolbazaar-real-hand-tools.jpg",
  grinding: "https://i.ibb.co/8gVvFKfk/toolbazaar-real-grinding.jpg",
  drilling: "https://i.ibb.co/1fQryXLM/toolbazaar-real-drilling.jpg",
  cutting: "https://i.ibb.co/XrwRjkWY/toolbazaar-real-cutting.jpg",
  measuring: "https://i.ibb.co/3Y4KnvTZ/toolbazaar-real-measuring.jpg",
  fasteners: "https://i.ibb.co/d4rC7VYj/toolbazaar-real-fasteners.jpg",
  "safety-gear": "https://i.ibb.co/Qvhhcq8T/toolbazaar-real-safety-gear.jpg",
  welding: "https://i.ibb.co/8DY7z2Fc/toolbazaar-real-welding.jpg",
  generators: "https://i.ibb.co/gLmMjCvZ/toolbazaar-real-generators.jpg",
};

async function updateProductImages() {
  await connectDB();
  const products = productsCollection();

  let updated = 0;
  for (const [category, image] of Object.entries(CATEGORY_IMAGES)) {
    const result = await products.updateMany({ category }, { $set: { images: [image] } });
    console.log(`${category}: updated ${result.modifiedCount} products`);
    updated += result.modifiedCount;
  }

  console.log(`\nTotal updated: ${updated}`);
  process.exit(0);
}

updateProductImages().catch((err) => {
  console.error("Image update failed:", err);
  process.exit(1);
});
