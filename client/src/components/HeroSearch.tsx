"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function HeroSearch() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("search", query.trim());
    router.push(`/explore${params.toString() ? `?${params}` : ""}`);
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-xl gap-2">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for drills, wrenches, generators…"
        className="flex-1 rounded-lg border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
      />
      <button
        type="submit"
        className="rounded-lg bg-brand-700 px-6 py-3 text-sm font-medium text-white transition hover:bg-brand-800"
      >
        Search
      </button>
    </form>
  );
}
