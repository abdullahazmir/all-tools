"use client";

import { useEffect, useState } from "react";
import { RequireRole } from "@/components/auth/RequireRole";
import { apiFetch } from "@/lib/api";
import type { Product, Shop } from "@/lib/types";

function PendingShops() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    apiFetch<{ shops: Shop[] }>("/shops/admin?status=pending")
      .then(({ shops }) => setShops(shops))
      .catch(() => setShops([]))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function act(id: string, action: "approve" | "suspend") {
    setBusyId(id);
    try {
      await apiFetch(`/shops/${id}/${action}`, { method: "PATCH" });
      setShops((prev) => prev.filter((s) => s._id !== id));
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <div className="h-24 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-800" />;
  if (shops.length === 0) return <p className="text-sm text-neutral-500">No shops awaiting review.</p>;

  return (
    <div className="space-y-3">
      {shops.map((shop) => (
        <div
          key={shop._id}
          className="flex items-center justify-between rounded-xl border border-neutral-200 px-4 py-3 dark:border-neutral-800"
        >
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{shop.shopName}</p>
            <p className="text-xs text-neutral-500">
              Fee paid: {shop.feePaid ? "yes" : "no"} · {shop.address || "no address given"}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => act(shop._id, "approve")}
              disabled={busyId === shop._id}
              className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-60"
            >
              Approve
            </button>
            <button
              onClick={() => act(shop._id, "suspend")}
              disabled={busyId === shop._id}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
            >
              Suspend
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function PendingProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    apiFetch<{ products: Product[] }>("/products/admin?status=pending")
      .then(({ products }) => setProducts(products))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function act(id: string, action: "approve" | "reject") {
    setBusyId(id);
    try {
      await apiFetch(`/products/${id}/${action}`, { method: "PATCH" });
      setProducts((prev) => prev.filter((p) => p._id !== id));
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <div className="h-24 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-800" />;
  if (products.length === 0) return <p className="text-sm text-neutral-500">No products awaiting review.</p>;

  return (
    <div className="space-y-3">
      {products.map((product) => (
        <div
          key={product._id}
          className="flex items-center justify-between rounded-xl border border-neutral-200 px-4 py-3 dark:border-neutral-800"
        >
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{product.title}</p>
            <p className="text-xs text-neutral-500">
              {product.shop?.shopName} · ${product.price.toFixed(2)} · {product.category}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => act(product._id, "approve")}
              disabled={busyId === product._id}
              className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-60"
            >
              Approve
            </button>
            <button
              onClick={() => act(product._id, "reject")}
              disabled={busyId === product._id}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function AdminDashboardContent() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">Admin dashboard</h1>

      <section className="mt-8">
        <h2 className="text-lg font-medium text-neutral-800 dark:text-neutral-200">Pending shops</h2>
        <div className="mt-3">
          <PendingShops />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-medium text-neutral-800 dark:text-neutral-200">Pending products</h2>
        <div className="mt-3">
          <PendingProducts />
        </div>
      </section>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <RequireRole role="admin">
      <AdminDashboardContent />
    </RequireRole>
  );
}
