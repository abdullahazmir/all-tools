"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useCartStore } from "@/lib/cartStore";

export default function CheckoutSuccessPage() {
  const clear = useCartStore((s) => s.clear);

  useEffect(() => {
    clear();
  }, [clear]);

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h1 className="text-2xl font-semibold text-green-700 dark:text-green-400">
          Order placed
        </h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
          Payment received. Your order is being processed — check your dashboard for status.
        </p>
        <Link
          href="/dashboard/buyer"
          className="mt-6 inline-block rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
        >
          View my orders
        </Link>
      </div>
    </div>
  );
}
