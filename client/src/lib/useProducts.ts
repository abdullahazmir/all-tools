import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { PaginatedProducts } from "@/lib/types";

export interface ProductFilters {
  search?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  minRating?: string;
  condition?: string;
  sort?: string;
  page?: number;
}

export function useProducts(filters: ProductFilters) {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.category) params.set("category", filters.category);
  if (filters.minPrice) params.set("minPrice", filters.minPrice);
  if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
  if (filters.minRating) params.set("minRating", filters.minRating);
  if (filters.condition) params.set("condition", filters.condition);
  if (filters.sort) params.set("sort", filters.sort);
  params.set("page", String(filters.page ?? 1));
  params.set("limit", "12");

  const queryString = params.toString();

  return useQuery({
    queryKey: ["products", queryString],
    queryFn: () => apiFetch<PaginatedProducts>(`/products?${queryString}`),
  });
}
