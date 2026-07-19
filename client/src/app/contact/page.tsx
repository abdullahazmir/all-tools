"use client";

import { useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus("submitting");
    try {
      await apiFetch("/contact", { method: "POST", body: JSON.stringify(form) });
      setStatus("done");
      setForm({ name: "", email: "", message: "" });
    } catch (err) {
      setStatus("idle");
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">Contact Us</h1>
      <p className="mt-2 text-neutral-600 dark:text-neutral-400">
        Questions about buying, selling, or your order? Send us a message.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-10 md:grid-cols-2">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Name
            </label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Email
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Message
            </label>
            <textarea
              required
              rows={5}
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {status === "done" && (
            <p className="text-sm text-green-700 dark:text-green-400">
              Message sent — we&apos;ll get back to you soon.
            </p>
          )}

          <button
            type="submit"
            disabled={status === "submitting"}
            className="w-full rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-800 disabled:opacity-60"
          >
            {status === "submitting" ? "Sending…" : "Send message"}
          </button>
        </form>

        <div className="space-y-4 text-sm text-neutral-600 dark:text-neutral-300">
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">Email</p>
            <a href="mailto:support@toolbazaar.dev" className="hover:underline">
              support@toolbazaar.dev
            </a>
          </div>
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">Phone</p>
            <p>+880 1XXX-XXXXXX</p>
          </div>
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">Address</p>
            <p>Mirpur, Dhaka, Bangladesh</p>
          </div>
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">Hours</p>
            <p>Sat–Thu, 10:00 AM – 7:00 PM</p>
          </div>
        </div>
      </div>
    </div>
  );
}
