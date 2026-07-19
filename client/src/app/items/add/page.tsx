"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { RequireRole } from "@/components/auth/RequireRole";
import { apiFetch, ApiError } from "@/lib/api";
import type { Category, Product } from "@/lib/types";

const productSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  shortDesc: z.string().min(5, "Short description must be at least 5 characters").max(160),
  fullDesc: z.string().min(10, "Full description must be at least 10 characters"),
  category: z.string().min(1, "Pick a category"),
  price: z
    .string()
    .min(1, "Price is required")
    .refine((v) => Number(v) > 0, "Price must be greater than 0"),
  condition: z.enum(["new", "used"]),
  stock: z
    .string()
    .min(1, "Stock is required")
    .refine((v) => Number.isInteger(Number(v)) && Number(v) >= 0, "Stock must be a non-negative whole number"),
  images: z.string().optional(),
});

type ProductForm = z.infer<typeof productSchema>;

type GenerateLength = "short" | "medium" | "long";

function AddProductForm() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [aiKeywords, setAiKeywords] = useState("");
  const [aiLength, setAiLength] = useState<GenerateLength>("medium");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: { condition: "new" },
  });

  const watchedTitle = watch("title");
  const watchedCategory = watch("category");

  useEffect(() => {
    apiFetch<{ categories: Category[] }>("/categories")
      .then(({ categories }) => setCategories(categories))
      .catch(() => setCategories([]));
  }, []);

  async function handleGenerate() {
    setAiError(null);
    if (!watchedTitle || watchedTitle.trim().length < 2) {
      setAiError("Enter a title first.");
      return;
    }
    if (!watchedCategory) {
      setAiError("Pick a category first.");
      return;
    }
    setAiLoading(true);
    try {
      const result = await apiFetch<{ shortDesc: string; fullDesc: string }>(
        "/ai/generate-description",
        {
          method: "POST",
          body: JSON.stringify({
            title: watchedTitle,
            category: watchedCategory,
            keywords: aiKeywords,
            length: aiLength,
          }),
        }
      );
      setValue("shortDesc", result.shortDesc, { shouldValidate: true });
      setValue("fullDesc", result.fullDesc, { shouldValidate: true });
      setHasGenerated(true);
    } catch (err) {
      setAiError(err instanceof ApiError ? err.message : "AI generation failed");
    } finally {
      setAiLoading(false);
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    setSuccess(false);
    try {
      const images = values.images
        ? values.images.split(",").map((s: string) => s.trim()).filter(Boolean)
        : [];
      await apiFetch<{ product: Product }>("/products", {
        method: "POST",
        body: JSON.stringify({
          ...values,
          price: Number(values.price),
          stock: Number(values.stock),
          images,
        }),
      });
      setSuccess(true);
      reset({ condition: "new" });
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setError("Your shop must be active before you can add products.");
      } else {
        setError(err instanceof ApiError ? err.message : "Something went wrong");
      }
    }
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
        Add a product
      </h1>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        New listings go through admin review before appearing publicly.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Title
          </label>
          <input
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            placeholder="e.g. Bosch GSB 13 RE Impact Drill"
            {...register("title")}
          />
          {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Category
            </label>
            <select
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              {...register("category")}
              defaultValue=""
            >
              <option value="" disabled>
                Select a category
              </option>
              {categories.map((c) => (
                <option key={c._id} value={c.slug}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="mt-1 text-xs text-red-600">{errors.category.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Condition
            </label>
            <select
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              {...register("condition")}
            >
              <option value="new">New</option>
              <option value="used">Used</option>
            </select>
          </div>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
            AI Content Generator
          </p>
          <p className="mt-0.5 text-xs text-blue-700 dark:text-blue-400">
            Fill in the title and category above, then generate a description.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <input
              value={aiKeywords}
              onChange={(e) => setAiKeywords(e.target.value)}
              placeholder="Optional keywords/specs, comma-separated"
              className="min-w-[200px] flex-1 rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 dark:border-blue-800 dark:bg-neutral-900 dark:text-neutral-100"
            />
            <select
              value={aiLength}
              onChange={(e) => setAiLength(e.target.value as GenerateLength)}
              className="rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 dark:border-blue-800 dark:bg-neutral-900 dark:text-neutral-100"
            >
              <option value="short">Short</option>
              <option value="medium">Medium</option>
              <option value="long">Long</option>
            </select>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={aiLoading}
              className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-800 disabled:opacity-60"
            >
              {aiLoading ? "Generating…" : hasGenerated ? "Regenerate" : "Generate with AI"}
            </button>
          </div>
          {aiError && <p className="mt-2 text-xs text-red-600">{aiError}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Short description
          </label>
          <input
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            placeholder="One line for the product card"
            {...register("shortDesc")}
          />
          {errors.shortDesc && (
            <p className="mt-1 text-xs text-red-600">{errors.shortDesc.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Full description
          </label>
          <textarea
            rows={5}
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            {...register("fullDesc")}
          />
          {errors.fullDesc && (
            <p className="mt-1 text-xs text-red-600">{errors.fullDesc.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Price (USD)
            </label>
            <input
              type="number"
              step="0.01"
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              {...register("price")}
            />
            {errors.price && <p className="mt-1 text-xs text-red-600">{errors.price.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Stock quantity
            </label>
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              {...register("stock")}
            />
            {errors.stock && <p className="mt-1 text-xs text-red-600">{errors.stock.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Image URLs (optional, comma-separated)
          </label>
          <input
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
            {...register("images")}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && (
          <p className="text-sm text-green-700 dark:text-green-400">
            Product submitted — pending admin approval.{" "}
            <button
              type="button"
              onClick={() => router.push("/items/manage")}
              className="underline"
            >
              View in Manage Products
            </button>
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-800 disabled:opacity-60"
        >
          {isSubmitting ? "Submitting…" : "Submit product"}
        </button>
      </form>
    </div>
  );
}

export default function AddProductPage() {
  return (
    <RequireRole role="seller">
      <AddProductForm />
    </RequireRole>
  );
}
