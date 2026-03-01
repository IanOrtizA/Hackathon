import { create } from "zustand";
import { Review } from "@/types/music";

interface ReviewFilters {
  albumId?: string;
  songId?: string;
  userId?: string;
  limit?: number;
}

interface CreateReviewInput {
  albumId: string;
  songId?: string;
  albumTitle: string;
  albumCover: string;
  artist: string;
  rating: number;
  text: string;
}

interface ReviewStore {
  reviews: Review[];
  isLoading: boolean;
  error: string | null;
  loadReviews: (filters?: ReviewFilters) => Promise<Review[]>;
  addReview: (review: CreateReviewInput, authToken: string) => Promise<Review>;
}

function buildReviewQuery(filters?: ReviewFilters) {
  const params = new URLSearchParams();

  if (!filters) {
    return "";
  }

  if (filters.albumId) {
    params.set("albumId", filters.albumId);
  }

  if (filters.songId) {
    params.set("songId", filters.songId);
  }

  if (filters.userId) {
    params.set("userId", filters.userId);
  }

  if (filters.limit) {
    params.set("limit", String(filters.limit));
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

export const useReviewStore = create<ReviewStore>((set) => ({
  reviews: [],
  isLoading: false,
  error: null,
  loadReviews: async (filters) => {
    const shouldHydrateGlobalState = !filters || Object.keys(filters).length === 0;

    if (shouldHydrateGlobalState) {
      set({ isLoading: true, error: null });
    }

    try {
      const response = await fetch(`/api/reviews${buildReviewQuery(filters)}`);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(typeof data?.error === "string" ? data.error : "Failed to fetch reviews.");
      }

      const reviews = Array.isArray(data.reviews) ? data.reviews : [];

      if (shouldHydrateGlobalState) {
        set({ reviews, isLoading: false, error: null });
      }

      return reviews;
    } catch (error) {
      if (shouldHydrateGlobalState) {
        set({
          isLoading: false,
          error: error instanceof Error ? error.message : "Failed to fetch reviews.",
        });
      }

      throw error;
    }
  },
  addReview: async (review, authToken) => {
    const response = await fetch("/api/reviews", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(review),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(typeof data?.error === "string" ? data.error : "Failed to save review.");
    }

    const createdReview = data.review as Review;

    set((state) => ({
      reviews: [createdReview, ...state.reviews],
      error: null,
    }));

    return createdReview;
  },
}));
