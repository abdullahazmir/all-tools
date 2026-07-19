"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { apiFetch, ApiError } from "@/lib/api";
import type { Review } from "@/lib/types";

export function ReviewSection({ productId }: { productId: string }) {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    apiFetch<{ reviews: Review[] }>(`/reviews/product/${productId}`)
      .then(({ reviews }) => setReviews(reviews))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }

  useEffect(load, [productId]);

  const myReview = session ? reviews.find((r) => r.userId === session.user.id) : undefined;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { reviews } = await apiFetch<{ reviews: Review[] }>("/reviews", {
        method: "POST",
        body: JSON.stringify({ productId, rating, comment }),
      });
      setReviews(reviews);
      setComment("");
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 403
          ? "You can review this product after purchasing it."
          : err instanceof ApiError
            ? err.message
            : "Something went wrong"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-10">
      <h2 className="text-lg font-medium text-neutral-800 dark:text-neutral-200">
        Reviews {reviews.length > 0 && `(${reviews.length})`}
      </h2>

      {session && (
        <form onSubmit={handleSubmit} className="mt-4 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {myReview ? "Update your review" : "Leave a review"}
          </p>
          <div className="mt-2 flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`text-2xl leading-none ${star <= rating ? "text-orange-500" : "text-neutral-300 dark:text-neutral-600"}`}
                aria-label={`${star} star`}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this product…"
            rows={3}
            className="mt-2 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
          />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-60"
          >
            {submitting ? "Submitting…" : myReview ? "Update review" : "Submit review"}
          </button>
        </form>
      )}

      <div className="mt-4 space-y-3">
        {loading ? (
          <div className="h-16 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-800" />
        ) : reviews.length === 0 ? (
          <p className="text-sm text-neutral-500">No reviews yet.</p>
        ) : (
          reviews.map((review) => (
            <div key={review._id} className="rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {review.userName}
                </span>
                <span className="text-sm text-orange-500">{"★".repeat(review.rating)}</span>
              </div>
              {review.comment && (
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">{review.comment}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
