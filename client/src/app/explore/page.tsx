"use client";

import { useEffect, useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import { ProductCardSkeleton } from "@/components/ProductCardSkeleton";
import { useProducts, type ProductFilters } from "@/lib/useProducts";
import { apiFetch } from "@/lib/api";
import type { Category } from "@/lib/types";

export default function ExplorePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState<ProductFilters>({ page: 1 });

  useEffect(() => {
    apiFetch<{ categories: Category[] }>("/categories")
      .then(({ categories }) => setCategories(categories))
      .catch(() => setCategories([]));
  }, []);

  const { data, isLoading, isFetching } = useProducts(filters);

  function updateFilter(patch: Partial<ProductFilters>) {
    setFilters((prev) => ({ ...prev, ...patch, page: 1 }));
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateFilter({ search: searchInput });
  }

  function goToPage(page: number) {
    setFilters((prev) => ({ ...prev, page }));
  }

  const selectClass =
    "rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
        Explore tools
      </h1>

      <form onSubmit={handleSearchSubmit} className="mt-4 flex gap-2">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by product name or shop name…"
          className="flex-1 rounded-lg border border-neutral-300 px-4 py-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
        />
        <button
          type="submit"
          className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
        >
          Search
        </button>
      </form>

      <div className="mt-4 flex flex-wrap gap-3">
        <select
          className={selectClass}
          value={filters.category ?? ""}
          onChange={(e) => updateFilter({ category: e.target.value || undefined })}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c.slug}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>

        <select
          className={selectClass}
          value={filters.condition ?? ""}
          onChange={(e) => updateFilter({ condition: e.target.value || undefined })}
        >
          <option value="">Any condition</option>
          <option value="new">New</option>
          <option value="used">Used</option>
        </select>

        <select
          className={selectClass}
          value={filters.minRating ?? ""}
          onChange={(e) => updateFilter({ minRating: e.target.value || undefined })}
        >
          <option value="">Any rating</option>
          <option value="4">4★ &amp; up</option>
          <option value="3">3★ &amp; up</option>
        </select>

        <input
          type="number"
          placeholder="Min price"
          className={`${selectClass} w-28`}
          value={filters.minPrice ?? ""}
          onChange={(e) => updateFilter({ minPrice: e.target.value || undefined })}
        />
        <input
          type="number"
          placeholder="Max price"
          className={`${selectClass} w-28`}
          value={filters.maxPrice ?? ""}
          onChange={(e) => updateFilter({ maxPrice: e.target.value || undefined })}
        />

        <select
          className={`${selectClass} ml-auto`}
          value={filters.sort ?? ""}
          onChange={(e) => updateFilter({ sort: e.target.value || undefined })}
        >
          <option value="">Newest</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
          <option value="rating">Top rated</option>
        </select>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? [...Array(8)].map((_, i) => <ProductCardSkeleton key={i} />)
          : data?.products.map((product) => <ProductCard key={product._id} product={product} />)}
      </div>

      {!isLoading && data?.products.length === 0 && (
        <p className="mt-10 text-center text-sm text-neutral-500">No products match your filters.</p>
      )}

      {data && data.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={() => goToPage((filters.page ?? 1) - 1)}
            disabled={(filters.page ?? 1) <= 1 || isFetching}
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-neutral-700"
          >
            Previous
          </button>
          <span className="text-sm text-neutral-500">
            Page {data.page} of {data.totalPages}
          </span>
          <button
            onClick={() => goToPage((filters.page ?? 1) + 1)}
            disabled={(filters.page ?? 1) >= data.totalPages || isFetching}
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-neutral-700"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
