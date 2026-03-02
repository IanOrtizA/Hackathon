import { create } from "zustand";
import { Review, ReviewComment } from "@/types/music";
import { apiUrl } from "@/lib/api";

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

type ReviewReaction = "like" | "dislike" | null;

interface ReviewStore {
  reviews: Review[];
  isLoading: boolean;
  error: string | null;
  loadReviews: (filters?: ReviewFilters, authToken?: string | null) => Promise<Review[]>;
  addReview: (review: CreateReviewInput, authToken: string) => Promise<Review>;
  deleteReview: (reviewId: string, authToken: string) => Promise<void>;
  reactToReview: (reviewId: string, reaction: ReviewReaction, authToken: string) => Promise<Review>;
  addComment: (reviewId: string, text: string, authToken: string) => Promise<Review>;
  deleteComment: (reviewId: string, commentId: string, authToken: string) => Promise<Review>;
  toggleCommentLike: (reviewId: string, commentId: string, authToken: string) => Promise<Review>;
}

function normalizeReviewComment(comment: ReviewComment): ReviewComment {
  return {
    ...comment,
    likesCount: typeof comment.likesCount === "number" ? comment.likesCount : 0,
    popularityScore: typeof comment.popularityScore === "number"
      ? comment.popularityScore
      : (typeof comment.likesCount === "number" ? comment.likesCount : 0),
    currentUserLiked: Boolean(comment.currentUserLiked),
  };
}

function normalizeReview(review: Review): Review {
  const currentUserReaction =
    review.currentUserReaction === "like" || review.currentUserReaction === "dislike"
      ? review.currentUserReaction
      : null;

  return {
    ...review,
    likesCount: typeof review.likesCount === "number" ? review.likesCount : 0,
    dislikesCount: typeof review.dislikesCount === "number" ? review.dislikesCount : 0,
    currentUserReaction,
    comments: Array.isArray(review.comments)
      ? review.comments.map((comment) => normalizeReviewComment(comment))
      : [],
  };
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
  loadReviews: async (filters, authToken) => {
    const shouldHydrateGlobalState = !filters || Object.keys(filters).length === 0;

    if (shouldHydrateGlobalState) {
      set({ isLoading: true, error: null });
    }

    try {
      const requestHeaders: HeadersInit = {};

      if (authToken) {
        requestHeaders.Authorization = `Bearer ${authToken}`;
      }

      const response = await fetch(apiUrl(`/api/reviews${buildReviewQuery(filters)}`), {
        headers: requestHeaders,
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(typeof data?.error === "string" ? data.error : "Failed to fetch reviews.");
      }

      const reviews = Array.isArray(data.reviews) ? data.reviews.map((review) => normalizeReview(review as Review)) : [];

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
    const response = await fetch(apiUrl("/api/reviews"), {
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

    const createdReview = normalizeReview(data.review as Review);

    set((state) => ({
      reviews: [createdReview, ...state.reviews],
      error: null,
    }));

    return createdReview;
  },
  deleteReview: async (reviewId, authToken) => {
    const response = await fetch(apiUrl(`/api/reviews/${encodeURIComponent(reviewId)}`), {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(typeof data?.error === "string" ? data.error : "Failed to delete review.");
    }

    set((state) => ({
      reviews: state.reviews.filter((review) => review.id !== reviewId),
      error: null,
    }));
  },
  reactToReview: async (reviewId, reaction, authToken) => {
    const response = await fetch(apiUrl(`/api/reviews/${encodeURIComponent(reviewId)}/reaction`), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ reaction }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(typeof data?.error === "string" ? data.error : "Failed to update review reaction.");
    }

    const updatedReview = normalizeReview(data.review as Review);

    set((state) => ({
      reviews: state.reviews.map((review) => (
        review.id === updatedReview.id ? updatedReview : review
      )),
      error: null,
    }));

    return updatedReview;
  },
  addComment: async (reviewId, text, authToken) => {
    const response = await fetch(apiUrl(`/api/reviews/${encodeURIComponent(reviewId)}/comments`), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ text }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(typeof data?.error === "string" ? data.error : "Failed to add comment.");
    }

    const updatedReview = normalizeReview(data.review as Review);

    set((state) => ({
      reviews: state.reviews.map((review) => (
        review.id === updatedReview.id ? updatedReview : review
      )),
      error: null,
    }));

    return updatedReview;
  },
  deleteComment: async (reviewId, commentId, authToken) => {
    const response = await fetch(
      apiUrl(`/api/reviews/${encodeURIComponent(reviewId)}/comments/${encodeURIComponent(commentId)}`),
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(typeof data?.error === "string" ? data.error : "Failed to delete comment.");
    }

    const updatedReview = normalizeReview(data.review as Review);

    set((state) => ({
      reviews: state.reviews.map((review) => (
        review.id === updatedReview.id ? updatedReview : review
      )),
      error: null,
    }));

    return updatedReview;
  },
  toggleCommentLike: async (reviewId, commentId, authToken) => {
    const response = await fetch(
      apiUrl(`/api/reviews/${encodeURIComponent(reviewId)}/comments/${encodeURIComponent(commentId)}/like`),
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(typeof data?.error === "string" ? data.error : "Failed to update comment like.");
    }

    const updatedReview = normalizeReview(data.review as Review);

    set((state) => ({
      reviews: state.reviews.map((review) => (
        review.id === updatedReview.id ? updatedReview : review
      )),
      error: null,
    }));

    return updatedReview;
  },
}));
