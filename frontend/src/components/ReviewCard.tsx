import { Review } from "@/types/music";
import { RatingStars } from "./RatingStars";
import { Link } from "react-router-dom";
import { Heart, MessageSquare, Send, ThumbsDown, ThumbsUp } from "lucide-react";
import { useState } from "react";
import { useReviewStore } from "@/stores/reviewStore";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const MAX_COMMENT_LENGTH = 300;

export function ReviewCard({ review }: { review: Review }) {
  const detailLink = review.songId ? `/song/${review.songId}` : `/album/${review.albumId}`;
  const reactToReview = useReviewStore((state) => state.reactToReview);
  const addComment = useReviewStore((state) => state.addComment);
  const toggleCommentLike = useReviewStore((state) => state.toggleCommentLike);
  const { isAuthenticated, token } = useAuth();
  const comments = Array.isArray(review.comments) ? review.comments : [];
  const likesCount = typeof review.likesCount === "number" ? review.likesCount : 0;
  const dislikesCount = typeof review.dislikesCount === "number" ? review.dislikesCount : 0;
  const currentUserReaction =
    review.currentUserReaction === "like" || review.currentUserReaction === "dislike"
      ? review.currentUserReaction
      : null;
  const [isSubmittingReaction, setIsSubmittingReaction] = useState(false);
  const [commentLikeTargetId, setCommentLikeTargetId] = useState<string | null>(null);
  const [isCommentsOpen, setIsCommentsOpen] = useState(comments.length > 0);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const trimmedComment = commentText.trim();
  const canSubmitComment =
    isAuthenticated &&
    trimmedComment.length > 0 &&
    trimmedComment.length <= MAX_COMMENT_LENGTH;

  async function handleReaction(nextReaction: "like" | "dislike") {
    if (!isAuthenticated || !token) {
      toast.error("Sign in to react to reviews.");
      return;
    }

    try {
      setIsSubmittingReaction(true);
      await reactToReview(
        review.id,
        currentUserReaction === nextReaction ? null : nextReaction,
        token
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update review reaction.");
    } finally {
      setIsSubmittingReaction(false);
    }
  }

  async function handleCommentSubmit() {
    if (!canSubmitComment || !token) {
      return;
    }

    try {
      setIsSubmittingComment(true);
      await addComment(review.id, trimmedComment, token);
      setCommentText("");
      setIsCommentsOpen(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add comment.");
    } finally {
      setIsSubmittingComment(false);
    }
  }

  async function handleCommentLike(commentId: string) {
    if (!isAuthenticated || !token) {
      toast.error("Sign in to like comments.");
      return;
    }

    try {
      setCommentLikeTargetId(commentId);
      await toggleCommentLike(review.id, commentId, token);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update comment like.");
    } finally {
      setCommentLikeTargetId(null);
    }
  }

  return (
    <div className="flex gap-4 rounded-xl bg-card p-4 border border-border card-hover">
      <Link to={detailLink} className="shrink-0">
        <img src={review.albumCover} alt={review.albumTitle} className="h-20 w-20 rounded-lg object-cover" />
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link to={detailLink} className="font-semibold text-sm hover:text-primary transition-colors truncate block">
              {review.albumTitle}
            </Link>
            <Link to={`/artist/${encodeURIComponent(review.artist)}`} className="text-xs text-muted-foreground hover:text-primary transition-colors">
              {review.artist}
            </Link>
          </div>
          <RatingStars rating={review.rating} size="sm" />
        </div>
        <p className="mt-2 text-sm text-secondary-foreground leading-relaxed line-clamp-2">{review.text}</p>
        <div className="mt-2 flex items-center gap-2">
          <Link to={`/user/${review.userId}`}>
            <img src={review.avatarUrl} alt={review.username} className="h-5 w-5 rounded-full" />
          </Link>
          <Link to={`/user/${review.userId}`} className="text-xs text-muted-foreground hover:text-primary transition-colors">{review.username}</Link>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">{review.date}</span>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              void handleReaction("like");
            }}
            disabled={isSubmittingReaction}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
              currentUserReaction === "like"
                ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-200"
                : "border-border text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
            } disabled:cursor-not-allowed disabled:opacity-60`}
            aria-label="Like review"
          >
            <ThumbsUp className="h-3.5 w-3.5" />
            {likesCount}
          </button>
          <button
            type="button"
            onClick={() => {
              void handleReaction("dislike");
            }}
            disabled={isSubmittingReaction}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
              currentUserReaction === "dislike"
                ? "border-rose-400/60 bg-rose-500/15 text-rose-200"
                : "border-border text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
            } disabled:cursor-not-allowed disabled:opacity-60`}
            aria-label="Dislike review"
          >
            <ThumbsDown className="h-3.5 w-3.5" />
            {dislikesCount}
          </button>
          <button
            type="button"
            onClick={() => setIsCommentsOpen((current) => !current)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
              isCommentsOpen
                ? "border-primary/40 bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
            }`}
            aria-label="Toggle comments"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            {comments.length}
          </button>
        </div>
        {isCommentsOpen && (
          <div className="mt-4 rounded-lg border border-border bg-background/50 p-3">
            {comments.length > 0 ? (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-2.5">
                    <Link to={`/user/${comment.userId}`} className="shrink-0">
                      <img src={comment.avatarUrl} alt={comment.username} className="h-7 w-7 rounded-full" />
                    </Link>
                    <div className="min-w-0 flex-1 rounded-lg bg-card/70 px-3 py-2">
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <div className="flex min-w-0 items-center gap-2">
                          <Link to={`/user/${comment.userId}`} className="truncate font-semibold hover:text-primary transition-colors">
                            {comment.username}
                          </Link>
                          <span className="text-muted-foreground">{comment.date}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            void handleCommentLike(comment.id);
                          }}
                          disabled={commentLikeTargetId === comment.id}
                          className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 font-medium transition-colors ${
                            comment.currentUserLiked
                              ? "border-primary/50 bg-primary/10 text-foreground"
                              : "border-border text-muted-foreground hover:text-foreground"
                          } disabled:cursor-not-allowed disabled:opacity-60`}
                          aria-label="Like comment"
                        >
                          <Heart className="h-3 w-3" />
                          {comment.likesCount}
                        </button>
                      </div>
                      <p className="mt-1 text-sm text-secondary-foreground whitespace-pre-wrap break-words">
                        {comment.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No replies yet.</p>
            )}

            <div className="mt-3 border-t border-border pt-3">
              {!isAuthenticated ? (
                <p className="text-xs text-muted-foreground">Sign in to reply to this review.</p>
              ) : (
                <>
                  <textarea
                    value={commentText}
                    onChange={(event) => setCommentText(event.target.value)}
                    placeholder="Write a reply..."
                    maxLength={MAX_COMMENT_LENGTH}
                    rows={2}
                    disabled={isSubmittingComment}
                    className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">
                      {trimmedComment.length}/{MAX_COMMENT_LENGTH}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        void handleCommentSubmit();
                      }}
                      disabled={!canSubmitComment || isSubmittingComment}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Send className="h-3.5 w-3.5" />
                      {isSubmittingComment ? "Posting..." : "Reply"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
