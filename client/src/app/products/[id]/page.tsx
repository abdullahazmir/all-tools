import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BuyNowButton } from "@/components/BuyNowButton";
import { ReviewSection } from "@/components/ReviewSection";
import type { Product } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

async function getProduct(id: string): Promise<Product | null> {
  const res = await fetch(`${API_URL}/products/${id}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to load product");
  const data = await res.json();
  return data.product as Product;
}

export default async function ProductDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div>
          <div className="aspect-square w-full overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-800">
            {product.images[0] ? (
              <Image
                src={product.images[0]}
                alt={product.title}
                width={600}
                height={600}
                className="h-full w-full object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-full items-center justify-center text-neutral-400">
                No image
              </div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-2">
              {product.images.slice(1, 5).map((img, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={img}
                  alt={`${product.title} ${i + 2}`}
                  className="aspect-square rounded-lg object-cover"
                />
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
            {product.title}
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{product.shortDesc}</p>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
              ${product.price.toFixed(2)}
            </span>
            {product.ratingCount > 0 && (
              <span className="text-sm text-neutral-500">
                ★ {product.ratingAvg.toFixed(1)} ({product.ratingCount} reviews)
              </span>
            )}
          </div>

          {product.shop && (
            <Link
              href={`/shops/${product.shop._id}`}
              className="mt-4 flex items-center gap-3 rounded-xl border border-neutral-200 p-3 transition hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
            >
              <div className="h-10 w-10 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                {product.shop.logo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.shop.logo} alt={product.shop.shopName} className="h-full w-full object-cover" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {product.shop.shopName}
                </p>
                <p className="text-xs text-neutral-500">Visit shop</p>
              </div>
            </Link>
          )}

          <BuyNowButton product={product} />

          <dl className="mt-8 grid grid-cols-2 gap-4 rounded-xl border border-neutral-200 p-4 text-sm dark:border-neutral-800">
            <div>
              <dt className="text-neutral-500">Category</dt>
              <dd className="font-medium text-neutral-900 dark:text-neutral-100 capitalize">
                {product.category.replace(/-/g, " ")}
              </dd>
            </div>
            <div>
              <dt className="text-neutral-500">Condition</dt>
              <dd className="font-medium text-neutral-900 dark:text-neutral-100 capitalize">
                {product.condition}
              </dd>
            </div>
            <div>
              <dt className="text-neutral-500">In stock</dt>
              <dd className="font-medium text-neutral-900 dark:text-neutral-100">{product.stock}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-medium text-neutral-800 dark:text-neutral-200">Description</h2>
        <p className="mt-2 whitespace-pre-line text-sm text-neutral-600 dark:text-neutral-300">
          {product.fullDesc}
        </p>
      </div>

      <ReviewSection productId={product._id} />
    </div>
  );
}
