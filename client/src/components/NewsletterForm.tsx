"use client";

import { useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setError(null);
    try {
      await apiFetch("/newsletter", { method: "POST", body: JSON.stringify({ email }) });
      setStatus("done");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  if (status === "done") {
    return <p className="text-sm font-medium text-brand-100">Thanks — you&apos;re subscribed!</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-md gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="flex-1 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-900 outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
      />
      <button
        type="submit"
        disabled={status === "submitting"}
        className="rounded-lg bg-accent-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-accent-700 disabled:opacity-60"
      >
        {status === "submitting" ? "…" : "Subscribe"}
      </button>
      {error && <p className="absolute mt-12 text-xs text-red-300">{error}</p>}
    </form>
  );
}
