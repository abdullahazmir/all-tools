import Link from "next/link";
import type { Product } from "@/lib/types";

const FALLBACK_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%23e5e5e5'/%3E%3C/svg%3E";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/products/${product._id}`}
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white transition hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div className="aspect-[4/3] w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.images[0] || FALLBACK_IMAGE}
          alt={product.title}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="line-clamp-1 text-sm font-medium text-neutral-900 dark:text-neutral-100">
          {product.title}
        </h3>
        <p className="line-clamp-2 flex-1 text-xs text-neutral-500 dark:text-neutral-400">
          {product.shortDesc}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            ${product.price.toFixed(2)}
          </span>
          {product.ratingCount > 0 && (
            <span className="text-xs text-neutral-500">
              ★ {product.ratingAvg.toFixed(1)} ({product.ratingCount})
            </span>
          )}
        </div>
        {product.shop && (
          <span className="text-xs text-neutral-400">{product.shop.shopName}</span>
        )}
      </div>
    </Link>
  );
}
