"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import { RequireRole } from "@/components/auth/RequireRole";
import { apiFetch } from "@/lib/api";
import type { AdminStats, Order, OrderStatus, Product, Shop } from "@/lib/types";

const CHART_COLOR = "#1d4ed8";

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-neutral-50">{value}</p>
    </div>
  );
}

function StatsOverview() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<AdminStats>("/admin/stats")
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-800" />
        ))}
      </div>
    );
  }
  if (!stats) return null;

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Shops" value={stats.totals.shops} />
        <StatTile label="Approved products" value={stats.totals.products} />
        <StatTile label="Orders" value={stats.totals.orders} />
        <StatTile label="Revenue" value={`$${stats.totals.revenue.toFixed(2)}`} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Signups over time</p>
          <div className="mt-2 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.signupsOverTime}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-200 dark:stroke-neutral-800" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke={CHART_COLOR} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Products by category</p>
          <div className="mt-2 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.categorySplit}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-200 dark:stroke-neutral-800" />
                <XAxis dataKey="category" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#ea580c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );
}

const orderStatusStyles: Record<OrderStatus, string> = {
  pending: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  paid: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  shipped: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  completed: "bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300",
};

function AllOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ orders: Order[] }>("/orders")
      .then(({ orders }) => setOrders(orders))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-24 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-800" />;
  if (orders.length === 0) return <p className="text-sm text-neutral-500">No orders yet.</p>;

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
      <table className="w-full text-left text-sm">
        <thead className="bg-neutral-50 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
          <tr>
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium">Items</th>
            <th className="px-4 py-3 font-medium">Total</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
          {orders.slice(0, 20).map((order) => (
            <tr key={order._id}>
              <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">
                {new Date(order.createdAt).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 text-neutral-900 dark:text-neutral-100">
                {order.items.map((i) => i.title).join(", ")}
              </td>
              <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">
                ${order.totalAmount.toFixed(2)}
              </td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${orderStatusStyles[order.status]}`}>
                  {order.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

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
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">Admin dashboard</h1>

      <div className="mt-6">
        <StatsOverview />
      </div>

      <section className="mt-10">
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

      <section className="mt-10">
        <h2 className="text-lg font-medium text-neutral-800 dark:text-neutral-200">All orders</h2>
        <div className="mt-3">
          <AllOrders />
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
