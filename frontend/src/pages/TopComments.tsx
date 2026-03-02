import { useEffect, useMemo, useState } from "react";
import { Heart, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { useReviewStore } from "@/stores/reviewStore";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface RankedReview {
  reviewId: string;
  userId: string;
  username: string;
  avatarUrl: string;
  text: string;
  likesCount: number;
  commentsCount: number;
  date: string;
  albumTitle: string;
  artist: string;
  detailLink: string;
}

interface TopReviewer {
  userId: string;
  username: string;
  avatarUrl: string;
  reviewCount: number;
  totalReviewLikes: number;
}

export default function TopComments() {
  const reviews = useReviewStore((state) => state.reviews);
  const isLoading = useReviewStore((state) => state.isLoading);
  const error = useReviewStore((state) => state.error);
  const loadReviews = useReviewStore((state) => state.loadReviews);
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<"reviews" | "reviewers">("reviews");

  useEffect(() => {
    if (reviews.length > 0 || isLoading) {
      return;
    }

    void loadReviews(undefined, token).catch(() => {
      // The page already renders the store error state and empty states.
    });
  }, [isLoading, loadReviews, reviews.length, token]);

  const allRankedReviews = useMemo<RankedReview[]>(() => (
    reviews
      .map((review) => ({
        reviewId: review.id,
        userId: review.userId,
        username: review.username,
        avatarUrl: review.avatarUrl,
        text: review.text,
        likesCount: review.likesCount,
        commentsCount: Array.isArray(review.comments) ? review.comments.length : 0,
        date: review.date,
        albumTitle: review.albumTitle,
        artist: review.artist,
        detailLink: review.songId ? `/song/${review.songId}` : `/album/${review.albumId}`,
      }))
      .sort((a, b) => {
        if (b.likesCount !== a.likesCount) {
          return b.likesCount - a.likesCount;
        }

        if (b.commentsCount !== a.commentsCount) {
          return b.commentsCount - a.commentsCount;
        }

        return b.date.localeCompare(a.date);
      })
  ), [reviews]);

  const topReviews = useMemo(() => allRankedReviews.slice(0, 10), [allRankedReviews]);

  const topReviewers = useMemo<TopReviewer[]>(() => {
    const reviewerMap = new Map<string, TopReviewer>();

    for (const review of reviews) {
      const current = reviewerMap.get(review.userId);

      if (current) {
        current.reviewCount += 1;
        current.totalReviewLikes += review.likesCount;
        continue;
      }

      reviewerMap.set(review.userId, {
        userId: review.userId,
        username: review.username,
        avatarUrl: review.avatarUrl,
        reviewCount: 1,
        totalReviewLikes: review.likesCount,
      });
    }

    return [...reviewerMap.values()]
      .sort((a, b) => {
        if (b.reviewCount !== a.reviewCount) {
          return b.reviewCount - a.reviewCount;
        }

        if (b.totalReviewLikes !== a.totalReviewLikes) {
          return b.totalReviewLikes - a.totalReviewLikes;
        }

        return a.username.localeCompare(b.username);
      })
      .slice(0, 10);
  }, [reviews]);

  const hasLeaderboardData = activeTab === "reviews"
    ? topReviews.length > 0
    : topReviewers.length > 0;

  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-8">
        <p className="text-sm font-medium text-primary">Community</p>
        <h1 className="mt-1 font-display text-4xl font-bold">Leaderboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Browse the most liked reviews and the users with the most published reviews so far.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 rounded-xl border border-border bg-card p-1">
        <button
          type="button"
          onClick={() => setActiveTab("reviews")}
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "reviews"
              ? "bg-background text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Top Reviews
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("reviewers")}
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "reviewers"
              ? "bg-background text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Top Reviewers
        </button>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-border bg-card/40 p-6 text-sm text-muted-foreground">
          Loading the current leaderboard...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-dashed border-border bg-card/40 p-6 text-sm text-muted-foreground">
          Unable to load the latest leaderboard right now.
        </div>
      ) : hasLeaderboardData ? (
        <div>
          {activeTab === "reviews" ? (
            <section>
            <div className="mb-4">
              <h2 className="font-display text-2xl font-bold">Top 10 Most Liked Reviews</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Sorted from the highest-liked reviews to the lowest-liked reviews.
              </p>
            </div>
            <div className="grid gap-4">
              {topReviews.map((review, index) => (
                <div key={review.reviewId} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-background text-sm font-semibold">
                        {index + 1}
                      </div>
                      <Link to={`/user/${review.userId}`} className="shrink-0">
                        <img src={review.avatarUrl} alt={review.username} className="h-10 w-10 rounded-full object-cover" />
                      </Link>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link to={`/user/${review.userId}`} className="text-sm font-semibold hover:text-primary transition-colors">
                            {review.username}
                          </Link>
                          <span className="text-xs text-muted-foreground">{review.date}</span>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-secondary-foreground">{review.text}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Heart className="h-3.5 w-3.5" />
                            {review.likesCount} likes
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MessageSquare className="h-3.5 w-3.5" />
                            {review.commentsCount} replies
                          </span>
                        </div>
                      </div>
                    </div>
                    <Link
                      to={review.detailLink}
                      className="shrink-0 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {review.albumTitle}
                    </Link>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    On {review.albumTitle} by {review.artist}
                  </p>
                </div>
              ))}
            </div>
            </section>
          ) : (
            <section>
            <div className="mb-4">
              <h2 className="font-display text-2xl font-bold">Top 10 Reviewers So Far</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Sorted from users with the most reviews already published on the site to the least reviews.
              </p>
            </div>
            <div className="grid gap-3">
              {topReviewers.map((reviewer, index) => (
                <div key={reviewer.userId} className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-background text-sm font-semibold">
                      {index + 1}
                    </div>
                    <Link to={`/user/${reviewer.userId}`}>
                      <img src={reviewer.avatarUrl} alt={reviewer.username} className="h-10 w-10 rounded-full object-cover" />
                    </Link>
                    <div className="min-w-0">
                      <Link to={`/user/${reviewer.userId}`} className="block truncate text-sm font-semibold hover:text-primary transition-colors">
                        {reviewer.username}
                      </Link>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {reviewer.reviewCount} reviews
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>{reviewer.totalReviewLikes} total likes</p>
                  </div>
                </div>
              ))}
            </div>
            </section>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card/40 p-6 text-sm text-muted-foreground">
          {activeTab === "reviews"
            ? "The reviews leaderboard will appear here once the community starts posting and liking reviews."
            : "The reviewers leaderboard will appear here once the community starts publishing reviews."}
        </div>
      )}
    </div>
  );
}
