import { notFound } from "next/navigation";
import { ProductCard } from "@/components/ProductCard";
import type { Product, Shop } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

async function getShop(id: string): Promise<Shop | null> {
  const res = await fetch(`${API_URL}/shops/${id}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to load shop");
  const data = await res.json();
  return data.shop as Shop;
}

async function getShopProducts(shopId: string): Promise<Product[]> {
  const res = await fetch(`${API_URL}/products?shopId=${shopId}&limit=48`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.products as Product[];
}

export default async function ShopPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const shop = await getShop(id);
  if (!shop || shop.status !== "active") notFound();

  const products = await getShopProducts(id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-center gap-4 rounded-2xl border border-neutral-200 p-6 dark:border-neutral-800">
        <div className="h-16 w-16 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
          {shop.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shop.logo} alt={shop.shopName} className="h-full w-full object-cover" />
          )}
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
            {shop.shopName}
          </h1>
          {shop.address && <p className="text-sm text-neutral-500">{shop.address}</p>}
        </div>
      </div>

      {shop.description && (
        <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-300">{shop.description}</p>
      )}

      <h2 className="mt-8 text-lg font-medium text-neutral-800 dark:text-neutral-200">
        Products from this shop
      </h2>

      {products.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-500">No products listed yet.</p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
