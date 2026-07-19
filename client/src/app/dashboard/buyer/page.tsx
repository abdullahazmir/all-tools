"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RequireRole } from "@/components/auth/RequireRole";
import { apiFetch } from "@/lib/api";
import type { Order, OrderStatus } from "@/lib/types";

const statusStyles: Record<OrderStatus, string> = {
  pending: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  paid: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  shipped: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  completed: "bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300",
};

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
        My orders
      </h1>

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
