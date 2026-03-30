"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/api";

interface ReviewFormProps {
  projectId: string;
  productId: string;
  orderId: string;
  onSuccess: () => void;
}

export default function ReviewForm({
  projectId,
  productId,
  orderId,
  onSuccess,
}: ReviewFormProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (rating < 1 || rating > 5) {
      setError("Please select a rating.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await apiFetch("/reviews", {
        method: "POST",
        body: JSON.stringify({
          projectId,
          productId,
          orderId,
          rating,
          title,
          body,
        }),
      });
      setSubmitted(true);
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  if (submitted) {
    return (
      <div className="rounded-xl border border-border bg-white p-6">
        <div className="flex items-center gap-2">
          <span className="text-lg text-green-600">✓</span>
          <p className="font-medium text-foreground">Thank you for your review!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-white p-6">
      <h3 className="text-lg font-semibold text-foreground">Leave a Review</h3>

      {error && (
        <div className="mt-3 rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {/* Star Rating */}
        <div>
          <label className="block text-sm font-medium text-foreground">
            Rating
          </label>
          <div className="mt-1 flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="text-2xl transition-colors"
                aria-label={`${star} star${star > 1 ? "s" : ""}`}
              >
                <span
                  className={
                    star <= (hoverRating || rating)
                      ? "text-amber-400"
                      : "text-gray-300"
                  }
                >
                  ★
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label
            htmlFor="review-title"
            className="block text-sm font-medium text-foreground"
          >
            Title
          </label>
          <input
            id="review-title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Summarize your experience"
            className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label
            htmlFor="review-body"
            className="block text-sm font-medium text-foreground"
          >
            Your Review
          </label>
          <textarea
            id="review-body"
            required
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What did you think about this product?"
            className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {submitting ? "Submitting..." : "Submit Review"}
        </button>
      </form>
    </div>
  );
}
