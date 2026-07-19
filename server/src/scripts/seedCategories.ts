import { connectDB } from "../config/db";
import { categoriesCollection } from "../models/category";

const CATEGORIES = [
  { name: "Power Tools", slug: "power-tools", icon: "🔌" },
  { name: "Hand Tools", slug: "hand-tools", icon: "🔧" },
  { name: "Grinding", slug: "grinding", icon: "⚙️" },
  { name: "Drilling", slug: "drilling", icon: "🪛" },
  { name: "Cutting", slug: "cutting", icon: "✂️" },
  { name: "Measuring", slug: "measuring", icon: "📏" },
  { name: "Fasteners", slug: "fasteners", icon: "🔩" },
  { name: "Safety Gear", slug: "safety-gear", icon: "🦺" },
  { name: "Welding", slug: "welding", icon: "🔥" },
  { name: "Generators", slug: "generators", icon: "🔋" },
];

async function seedCategories() {
  await connectDB();
  const categories = categoriesCollection();

  for (const category of CATEGORIES) {
    await categories.updateOne(
      { slug: category.slug },
      { $set: category },
      { upsert: true }
    );
    console.log(`Upserted category: ${category.name}`);
  }

  process.exit(0);
}

seedCategories().catch((err) => {
  console.error("Category seed failed:", err);
  process.exit(1);
});
