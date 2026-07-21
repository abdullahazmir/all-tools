"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { apiFetch, ApiError } from "@/lib/api";
import { useCartStore } from "@/lib/cartStore";
import type { Product } from "@/lib/types";

const FALLBACK_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%23e5e5e5'/%3E%3C/svg%3E";

const SUGGESTIONS = [
  "Cordless drill under $100",
  "Best safety gear for welding",
  "Tools for hanging drywall",
];

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  products?: Product[];
}

const GREETING: ChatMessage = {
  role: "assistant",
  text: "Hi! Tell me what you're working on or what tool you need, and I'll find a few good options from ToolBazaar.",
};

export function AssistantChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, loading]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const history = messages.slice(-6).map((m) => ({ role: m.role, text: m.text }));
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setInput("");
    setLoading(true);

    try {
      const data = await apiFetch<{ reply: string; products: Product[] }>("/ai/assistant", {
        method: "POST",
        body: JSON.stringify({ message: trimmed, history }),
      });
      setMessages((prev) => [...prev, { role: "assistant", text: data.reply, products: data.products }]);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Something went wrong. Try again.";
      setMessages((prev) => [...prev, { role: "assistant", text: msg }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="flex h-[28rem] w-80 flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-900 sm:w-96">
          <div className="flex items-center justify-between border-b border-neutral-200 bg-brand-700 px-4 py-3 dark:border-neutral-800">
            <span className="text-sm font-semibold text-white">ToolBazaar Assistant</span>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
              className="text-white/80 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "bg-brand-700 text-white"
                      : "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100"
                  }`}
                >
                  <p>{m.text}</p>
                  {m.products && m.products.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {m.products.map((p) => (
                        <div
                          key={p._id}
                          className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white p-2 dark:border-neutral-700 dark:bg-neutral-900"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={p.images[0] || FALLBACK_IMAGE}
                            alt={p.title}
                            className="h-10 w-10 flex-shrink-0 rounded object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <Link
                              href={`/products/${p._id}`}
                              className="block truncate text-xs font-medium text-neutral-900 hover:underline dark:text-neutral-100"
                            >
                              {p.title}
                            </Link>
                            <span className="text-xs text-neutral-500">${p.price.toFixed(2)}</span>
                          </div>
                          <button
                            onClick={() =>
                              addItem({
                                productId: p._id,
                                title: p.title,
                                price: p.price,
                                image: p.images[0] || FALLBACK_IMAGE,
                                shopId: p.shop?._id ?? "",
                                shopName: p.shop?.shopName ?? "",
                                stock: p.stock,
                              })
                            }
                            className="flex-shrink-0 rounded-lg bg-accent-600 px-2 py-1 text-xs font-medium text-white hover:bg-accent-700"
                          >
                            Add
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-xl bg-neutral-100 px-3 py-2 text-sm text-neutral-500 dark:bg-neutral-800">
                  Thinking…
                </div>
              </div>
            )}
            {messages.length === 1 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex gap-2 border-t border-neutral-200 p-3 dark:border-neutral-800"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about a tool or project..."
              disabled={loading}
              className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-brand-600 disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-800"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-lg bg-brand-700 px-3 py-2 text-sm font-medium text-white hover:bg-brand-800 disabled:opacity-60"
            >
              Send
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full bg-brand-700 px-4 py-3 text-sm font-medium text-white shadow-lg hover:bg-brand-800"
      >
        {open ? "Close" : "🤖 Ask AI"}
      </button>
    </div>
  );
}
