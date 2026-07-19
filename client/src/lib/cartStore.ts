import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  productId: string;
  title: string;
  price: number;
  image: string;
  shopId: string;
  shopName: string;
  stock: number;
  qty: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "qty">, qty?: number) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item, qty = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.productId === item.productId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? { ...i, qty: Math.min(i.qty + qty, i.stock) }
                  : i
              ),
            };
          }
          return { items: [...state.items, { ...item, qty: Math.min(qty, item.stock) }] };
        }),
      removeItem: (productId) =>
        set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),
      updateQty: (productId, qty) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId ? { ...i, qty: Math.max(1, Math.min(qty, i.stock)) } : i
          ),
        })),
      clear: () => set({ items: [] }),
    }),
    { name: "toolbazaar-cart" }
  )
);
