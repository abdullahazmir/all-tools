"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RequireRole } from "@/components/auth/RequireRole";
import { ProductCard } from "@/components/ProductCard";
import { ProductCardSkeleton } from "@/components/ProductCardSkeleton";
import { apiFetch } from "@/lib/api";
import { authClient, useSession } from "@/lib/auth-client";
import type { Order, OrderStatus, Product } from "@/lib/types";

function ProfileSettings() {
  const { data: session } = useSession();
  const router = useRouter();

  if (!session) return null;

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <section className="mt-10 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      <h2 className="text-lg font-medium text-neutral-800 dark:text-neutral-200">Profile</h2>
      <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-neutral-500">Name</dt>
          <dd className="text-neutral-900 dark:text-neutral-100">{session.user.name}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">Email</dt>
          <dd className="text-neutral-900 dark:text-neutral-100">{session.user.email}</dd>
        </div>
      </dl>
      <button
        onClick={handleSignOut}
        className="mt-4 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
      >
        Sign out
      </button>
    </section>
  );
}

const statusStyles: Record<OrderStatus, string> = {
  pending: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  paid: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  shipped: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  completed: "bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300",
};

function RecommendedForYou() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cheaperOnly, setCheaperOnly] = useState(false);

  useEffect(() => {
    setLoading(true);
    const query = cheaperOnly && products.length > 0
      ? `?maxPrice=${Math.round((products.reduce((s, p) => s + p.price, 0) / products.length) * 0.6)}`
      : "";
    apiFetch<{ products: Product[] }>(`/ai/recommendations${query}`)
      .then(({ products }) => setProducts(products))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cheaperOnly]);

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-neutral-800 dark:text-neutral-200">
          Recommended for you
        </h2>
        <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
          <input
            type="checkbox"
            checked={cheaperOnly}
            onChange={(e) => setCheaperOnly(e.target.checked)}
          />
          Cheaper alternatives
        </label>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? [...Array(4)].map((_, i) => <ProductCardSkeleton key={i} />)
          : products.map((product) => <ProductCard key={product._id} product={product} />)}
      </div>
      {!loading && products.length === 0 && (
        <p className="mt-4 text-sm text-neutral-500">
          Browse a few products and recommendations will show up here.
        </p>
      )}
    </section>
  );
}

function BuyerDashboardContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ orders: Order[] }>("/orders/mine")
      .then(({ orders }) => setOrders(orders))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
        My dashboard
      </h1>

      <div className="mt-6">
        <RecommendedForYou />
      </div>

      <h2 className="text-lg font-medium text-neutral-800 dark:text-neutral-200">My orders</h2>

      {loading ? (
        <div className="mt-6 space-y-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-800" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-6">
          <p className="text-sm text-neutral-500">No orders yet.</p>
          <Link href="/explore" className="mt-2 inline-block text-sm text-blue-700 hover:underline dark:text-blue-400">
            Explore tools
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {orders.map((order) => (
            <div key={order._id} className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500">
                  {new Date(order.createdAt).toLocaleDateString()}
                </span>
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusStyles[order.status]}`}>
                  {order.status}
                </span>
              </div>
              <ul className="mt-2 space-y-1">
                {order.items.map((item) => (
                  <li key={item.productId} className="flex justify-between text-sm">
                    <Link href={`/products/${item.productId}`} className="text-neutral-700 hover:underline dark:text-neutral-300">
                      {item.title} × {item.qty}
                    </Link>
                    <span className="text-neutral-500">${(item.price * item.qty).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex justify-end text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Total: ${order.totalAmount.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      )}

      <ProfileSettings />
    </div>
  );
}

export default function BuyerDashboardPage() {
  return (
    <RequireRole role="buyer">
      <BuyerDashboardContent />
    </RequireRole>
  );
}
