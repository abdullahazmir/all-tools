"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RequireRole } from "@/components/auth/RequireRole";
import { apiFetch } from "@/lib/api";
import type { Shop } from "@/lib/types";

function ShopStatusBanner({ shop }: { shop: Shop }) {
  const statusStyles: Record<Shop["status"], string> = {
    active: "border-green-300 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-300",
    pending: "border-orange-300 bg-orange-50 text-orange-800 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-300",
    suspended: "border-red-300 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
  };

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${statusStyles[shop.status]}`}>
      <span className="font-medium">{shop.shopName}</span> — status: {shop.status}
      {!shop.feePaid && (
        <>
          {" "}
          —{" "}
          <Link href="/become-seller" className="underline">
            complete registration payment
          </Link>
        </>
      )}
    </div>
  );
}

function SellerDashboardContent() {
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ shop: Shop }>("/shops/mine")
      .then(({ shop }) => setShop(shop))
      .catch(() => setShop(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
        Seller dashboard
      </h1>

      <div className="mt-4">
        {loading ? (
          <div className="h-14 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-800" />
        ) : shop ? (
          <ShopStatusBanner shop={shop} />
        ) : (
          <p className="text-sm text-neutral-500">No shop found for this account.</p>
        )}
      </div>

      {shop?.status === "active" && (
        <div className="mt-6 flex gap-3">
          <Link
            href="/items/add"
            className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
          >
            Add product
          </Link>
          <Link
            href="/items/manage"
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200"
          >
            Manage products
          </Link>
        </div>
      )}
    </div>
  );
}

export default function SellerDashboardPage() {
  return (
    <RequireRole role="seller">
      <SellerDashboardContent />
    </RequireRole>
  );
}
