"use client";

import { useState } from "react";
import Link from "next/link";
import { useCartStore } from "@/lib/cartStore";
import { apiFetch, ApiError } from "@/lib/api";

export default function CartPage() {
  const { items, removeItem, updateQty } = useCartStore();
  const [error, setError] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);

  async function handleCheckout() {
    setError(null);
    setCheckingOut(true);
    try {
      const { url } = await apiFetch<{ url: string }>("/orders/checkout", {
        method: "POST",
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, qty: i.qty })),
        }),
      });
      window.location.href = url;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
      setCheckingOut(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
          Your cart is empty
        </h1>
        <Link
          href="/explore"
          className="mt-4 inline-block rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
        >
          Explore tools
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">Your cart</h1>

      <div className="mt-6 space-y-3">
        {items.map((item) => (
          <div
            key={item.productId}
            className="flex items-center gap-4 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800"
          >
            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">
              {item.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
              )}
            </div>
            <div className="flex-1">
              <Link href={`/products/${item.productId}`} className="text-sm font-medium text-neutral-900 hover:underline dark:text-neutral-100">
                {item.title}
              </Link>
              <p className="text-xs text-neutral-500">{item.shopName}</p>
              <p className="mt-1 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                ${item.price.toFixed(2)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQty(item.productId, item.qty - 1)}
                disabled={item.qty <= 1}
                className="h-7 w-7 rounded border border-neutral-300 text-sm disabled:opacity-40 dark:border-neutral-700"
              >
                −
              </button>
              <span className="w-6 text-center text-sm">{item.qty}</span>
              <button
                onClick={() => updateQty(item.productId, item.qty + 1)}
                disabled={item.qty >= item.stock}
                className="h-7 w-7 rounded border border-neutral-300 text-sm disabled:opacity-40 dark:border-neutral-700"
              >
                +
              </button>
            </div>
            <button
              onClick={() => removeItem(item.productId)}
              className="text-sm text-red-600 hover:underline"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Subtotal</span>
        <span className="text-xl font-bold text-neutral-900 dark:text-neutral-50">
          ${subtotal.toFixed(2)}
        </span>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <button
        onClick={handleCheckout}
        disabled={checkingOut}
        className="mt-4 w-full rounded-lg bg-blue-700 px-4 py-3 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-60"
      >
        {checkingOut ? "Redirecting to payment…" : "Checkout"}
      </button>
    </div>
  );
}
