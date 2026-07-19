"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import type { Shop } from "@/lib/types";

export default function BecomeSellerSuccessPage() {
  const [shop, setShop] = useState<Shop | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Webhook is async — poll briefly for the shop to flip to active.
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts += 1;
      try {
        const { shop } = await apiFetch<{ shop: Shop }>("/shops/mine");
        setShop(shop);
        if (shop.status === "active" || attempts >= 8) {
          clearInterval(interval);
          setChecked(true);
        }
      } catch {
        if (attempts >= 8) {
          clearInterval(interval);
          setChecked(true);
        }
      }
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        {shop?.status === "active" ? (
          <>
            <h1 className="text-2xl font-semibold text-green-700 dark:text-green-400">
              Payment received
            </h1>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
              {shop.shopName} is now active. You can start listing products.
            </p>
            <Link
              href="/items/add"
              className="mt-6 inline-block rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
            >
              Add your first product
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
              Payment received — activating your shop…
            </h1>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
              {checked
                ? "This is taking longer than expected. Refresh in a moment, or check the become-seller page for status."
                : "Confirming with Stripe, this usually takes a few seconds."}
            </p>
            <Link
              href="/become-seller"
              className="mt-6 inline-block rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200"
            >
              Check status
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
