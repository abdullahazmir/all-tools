"use client";

import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/cartStore";
import type { Product } from "@/lib/types";

export function BuyNowButton({ product }: { product: Product }) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);

  function handleBuyNow() {
    addItem(
      {
        productId: product._id,
        title: product.title,
        price: product.price,
        image: product.images[0] ?? "",
        shopId: product.shop?._id ?? product.shopId,
        shopName: product.shop?.shopName ?? "",
        stock: product.stock,
      },
      1
    );
    router.push("/cart");
  }

  const outOfStock = product.stock <= 0;

  return (
    <button
      onClick={handleBuyNow}
      disabled={outOfStock}
      className="mt-6 w-full rounded-lg bg-orange-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {outOfStock ? "Out of stock" : "Buy Now"}
    </button>
  );
}
