"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSession } from "@/lib/auth-client";
import { apiFetch, ApiError } from "@/lib/api";
import type { Shop } from "@/lib/types";

const shopSchema = z.object({
  shopName: z.string().min(2, "Shop name must be at least 2 characters"),
  description: z.string().max(500).optional(),
  address: z.string().max(200).optional(),
  logo: z.string().url("Enter a valid URL").optional().or(z.literal("")),
});

type ShopForm = z.infer<typeof shopSchema>;

export default function BecomeSellerPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [checkingShop, setCheckingShop] = useState(true);
  const [existingShop, setExistingShop] = useState<Shop | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ShopForm>({ resolver: zodResolver(shopSchema) });

  useEffect(() => {
    if (isPending) return;
    if (!session) {
      router.replace("/login?redirect=/become-seller");
      return;
    }
    apiFetch<{ shop: Shop }>("/shops/mine")
      .then(({ shop }) => setExistingShop(shop))
      .catch(() => setExistingShop(null))
      .finally(() => setCheckingShop(false));
  }, [isPending, session, router]);

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      const { shop } = await apiFetch<{ shop: Shop }>("/shops", {
        method: "POST",
        body: JSON.stringify(values),
      });
      const { url } = await apiFetch<{ url: string }>("/payments/seller-fee-checkout", {
        method: "POST",
        body: JSON.stringify({ shopId: shop._id }),
      });
      window.location.href = url;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  });

  async function payNow(shopId: string) {
    setError(null);
    try {
      const { url } = await apiFetch<{ url: string }>("/payments/seller-fee-checkout", {
        method: "POST",
        body: JSON.stringify({ shopId }),
      });
      window.location.href = url;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  if (isPending || checkingShop) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-neutral-500">
        Loading…
      </div>
    );
  }

  if (existingShop) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
            {existingShop.shopName}
          </h1>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            Status:{" "}
            <span
              className={
                existingShop.status === "active"
                  ? "font-medium text-green-700 dark:text-green-400"
                  : existingShop.status === "suspended"
                    ? "font-medium text-red-700 dark:text-red-400"
                    : "font-medium text-orange-700 dark:text-orange-400"
              }
            >
              {existingShop.status}
            </span>
          </p>

          {!existingShop.feePaid && existingShop.status !== "suspended" && (
            <>
              <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-300">
                Your shop is created but the registration fee hasn&apos;t been paid yet.
                Pay it to activate your shop and start listing products.
              </p>
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
              <button
                onClick={() => payNow(existingShop._id)}
                className="mt-4 w-full rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-700"
              >
                Pay registration fee
              </button>
            </>
          )}

          {existingShop.feePaid && existingShop.status === "active" && (
            <p className="mt-4 text-sm text-green-700 dark:text-green-400">
              Your shop is active. You can start adding products.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
          Register your shop
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          A one-time $49 registration fee activates your shop so you can start listing tools.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Shop name
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              {...register("shopName")}
            />
            {errors.shopName && (
              <p className="mt-1 text-xs text-red-600">{errors.shopName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Description
            </label>
            <textarea
              rows={3}
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              {...register("description")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Address
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              {...register("address")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Logo URL (optional)
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              {...register("logo")}
            />
            {errors.logo && <p className="mt-1 text-xs text-red-600">{errors.logo.message}</p>}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-700 disabled:opacity-60"
          >
            {isSubmitting ? "Redirecting to payment…" : "Continue to payment ($49)"}
          </button>
        </form>
      </div>
    </div>
  );
}
