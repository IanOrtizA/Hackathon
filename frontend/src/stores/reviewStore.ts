import { create } from "zustand";
import { Review } from "@/types/music";
import { recentReviews as initialReviews, currentUser } from "@/data/mockData";

interface ReviewStore {
  reviews: Review[];
  userRecentAlbumIds: string[];
  addReview: (review: Omit<Review, "id" | "userId" | "username" | "avatarUrl" | "date">) => void;
}

export const useReviewStore = create<ReviewStore>((set) => ({
  reviews: initialReviews,
  userRecentAlbumIds: [...currentUser.recentAlbumIds],
  addReview: (review) =>
    set((state) => {
      // Update recentAlbumIds on the currentUser object so taste matching stays live
      if (!currentUser.recentAlbumIds.includes(review.albumId)) {
        currentUser.recentAlbumIds = [review.albumId, ...currentUser.recentAlbumIds];
      }

      return {
        reviews: [
          {
            ...review,
            id: `r-${Date.now()}`,
            userId: currentUser.id,
            username: currentUser.username,
            avatarUrl: currentUser.avatarUrl,
            date: new Date().toISOString().split("T")[0],
          },
          ...state.reviews,
        ],
        userRecentAlbumIds: currentUser.recentAlbumIds,
      };
    }),
}));
