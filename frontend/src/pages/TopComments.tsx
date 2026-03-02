import { useMemo, useState } from "react";
import { Heart, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { useReviewStore } from "@/stores/reviewStore";
import { cn } from "@/lib/utils";

interface RankedComment {
  commentId: string;
  reviewId: string;
  userId: string;
  username: string;
  avatarUrl: string;
  text: string;
  likesCount: number;
  popularityScore: number;
  date: string;
  albumTitle: string;
  artist: string;
  detailLink: string;
}

interface TopReviewer {
  userId: string;
  username: string;
  avatarUrl: string;
  commentCount: number;
  totalCommentLikes: number;
}

export default function TopComments() {
  const reviews = useReviewStore((state) => state.reviews);
  const [activeTab, setActiveTab] = useState<"comments" | "reviewers">("comments");

  const allRankedComments = useMemo<RankedComment[]>(() => (
    reviews
      .flatMap((review) => review.comments.map((comment) => ({
        commentId: comment.id,
        reviewId: review.id,
        userId: comment.userId,
        username: comment.username,
        avatarUrl: comment.avatarUrl,
        text: comment.text,
        likesCount: comment.likesCount,
        popularityScore: comment.popularityScore,
        date: comment.date,
        albumTitle: review.albumTitle,
        artist: review.artist,
        detailLink: review.songId ? `/song/${review.songId}` : `/album/${review.albumId}`,
      })))
      .sort((a, b) => {
        if (b.popularityScore !== a.popularityScore) {
          return b.popularityScore - a.popularityScore;
        }

        if (b.likesCount !== a.likesCount) {
          return b.likesCount - a.likesCount;
        }

        return b.date.localeCompare(a.date);
      })
  ), [reviews]);

  const topComments = useMemo(() => allRankedComments.slice(0, 10), [allRankedComments]);

  const topReviewers = useMemo<TopReviewer[]>(() => {
    const reviewerMap = new Map<string, TopReviewer>();

    for (const comment of allRankedComments) {
      const current = reviewerMap.get(comment.userId);

      if (current) {
        current.commentCount += 1;
        current.totalCommentLikes += comment.likesCount;
        continue;
      }

      reviewerMap.set(comment.userId, {
        userId: comment.userId,
        username: comment.username,
        avatarUrl: comment.avatarUrl,
        commentCount: 1,
        totalCommentLikes: comment.likesCount,
      });
    }

    return [...reviewerMap.values()]
      .sort((a, b) => {
        if (b.commentCount !== a.commentCount) {
          return b.commentCount - a.commentCount;
        }

        if (b.totalCommentLikes !== a.totalCommentLikes) {
          return b.totalCommentLikes - a.totalCommentLikes;
        }

        return a.username.localeCompare(b.username);
      })
      .slice(0, 10);
  }, [allRankedComments]);

  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-8">
        <p className="text-sm font-medium text-primary">Community</p>
        <h1 className="mt-1 font-display text-4xl font-bold">Leaderboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The community leaders are ranked here by comment popularity and total participation.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 rounded-xl border border-border bg-card p-1">
        <button
          type="button"
          onClick={() => setActiveTab("comments")}
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "comments"
              ? "bg-background text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Comments
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

      {allRankedComments.length > 0 ? (
        <div>
          {activeTab === "comments" ? (
            <section>
            <div className="mb-4">
              <h2 className="font-display text-2xl font-bold">Top 10 Comments</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Ranked by comment likes and popularity.
              </p>
            </div>
            <div className="grid gap-4">
              {topComments.map((comment, index) => (
                <div key={comment.commentId} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-background text-sm font-semibold">
                        {index + 1}
                      </div>
                      <Link to={`/user/${comment.userId}`} className="shrink-0">
                        <img src={comment.avatarUrl} alt={comment.username} className="h-10 w-10 rounded-full object-cover" />
                      </Link>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link to={`/user/${comment.userId}`} className="text-sm font-semibold hover:text-primary transition-colors">
                            {comment.username}
                          </Link>
                          <span className="text-xs text-muted-foreground">{comment.date}</span>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-secondary-foreground">{comment.text}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Heart className="h-3.5 w-3.5" />
                            {comment.likesCount} likes
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MessageSquare className="h-3.5 w-3.5" />
                            Popularity {comment.popularityScore}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Link
                      to={comment.detailLink}
                      className="shrink-0 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {comment.albumTitle}
                    </Link>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    On {comment.albumTitle} by {comment.artist}
                  </p>
                </div>
              ))}
            </div>
            </section>
          ) : (
            <section>
            <div className="mb-4">
              <h2 className="font-display text-2xl font-bold">Top 10 Reviewers</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Ranked by who has commented the most.
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
                        {reviewer.commentCount} comments
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>{reviewer.totalCommentLikes} total likes</p>
                  </div>
                </div>
              ))}
            </div>
            </section>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card/40 p-6 text-sm text-muted-foreground">
          The leaderboard will appear here once the community starts replying and liking comments.
        </div>
      )}
    </div>
  );
}
