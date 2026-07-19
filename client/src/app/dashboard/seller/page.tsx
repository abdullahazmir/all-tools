"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RequireRole } from "@/components/auth/RequireRole";
import { apiFetch } from "@/lib/api";
import type { Order, Shop } from "@/lib/types";

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

function RecentOrders({ shopId }: { shopId: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ orders: Order[] }>(`/orders/shop/${shopId}`)
      .then(({ orders }) => setOrders(orders))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [shopId]);

  if (loading) return <div className="h-16 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-800" />;
  if (orders.length === 0) return <p className="text-sm text-neutral-500">No orders yet.</p>;

  return (
    <div className="space-y-2">
      {orders.slice(0, 10).map((order) => {
        const mine = order.items.filter((i) => i.shopId === shopId);
        const shopTotal = mine.reduce((sum, i) => sum + i.price * i.qty, 0);
        return (
          <div
            key={order._id}
            className="flex items-center justify-between rounded-xl border border-neutral-200 px-4 py-3 text-sm dark:border-neutral-800"
          >
            <div>
              <p className="text-neutral-900 dark:text-neutral-100">
                {mine.map((i) => `${i.title} × ${i.qty}`).join(", ")}
              </p>
              <p className="text-xs text-neutral-500">{new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="text-right">
              <p className="font-medium text-neutral-900 dark:text-neutral-100">${shopTotal.toFixed(2)}</p>
              <p className="text-xs text-neutral-500">{order.status}</p>
            </div>
          </div>
        );
      })}
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
        <>
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

          <section className="mt-8">
            <h2 className="text-lg font-medium text-neutral-800 dark:text-neutral-200">
              Recent orders
            </h2>
            <div className="mt-3">
              <RecentOrders shopId={shop._id} />
            </div>
          </section>
        </>
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
