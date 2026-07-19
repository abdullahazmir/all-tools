"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RequireRole } from "@/components/auth/RequireRole";
import { apiFetch } from "@/lib/api";
import type { Product, ProductStatus } from "@/lib/types";

const statusStyles: Record<ProductStatus, string> = {
  approved: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  pending: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

function ManageProductsContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    apiFetch<{ products: Product[] }>("/products/mine")
      .then(({ products }) => setProducts(products))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await apiFetch(`/products/${id}`, { method: "DELETE" });
      setProducts((prev) => prev.filter((p) => p._id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
          Manage products
        </h1>
        <Link
          href="/items/add"
          className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
        >
          Add product
        </Link>
      </div>

      {loading ? (
        <div className="mt-6 space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-800" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <p className="mt-6 text-sm text-neutral-500">No products yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {products.map((product) => (
                <tr key={product._id}>
                  <td className="px-4 py-3 text-neutral-900 dark:text-neutral-100">{product.title}</td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">
                    ${product.price.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">{product.stock}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusStyles[product.status]}`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <Link href={`/products/${product._id}`} className="text-blue-700 hover:underline dark:text-blue-400">
                        View
                      </Link>
                      <button
                        onClick={() => handleDelete(product._id)}
                        disabled={deletingId === product._id}
                        className="text-red-600 hover:underline disabled:opacity-60"
                      >
                        {deletingId === product._id ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function ManageProductsPage() {
  return (
    <RequireRole role="seller">
      <ManageProductsContent />
    </RequireRole>
  );
}
